import { HonoWithConvex } from "convex-helpers/server/hono";
import { ActionCtx } from "./_generated/server";
import { Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { createMiddleware } from "hono/factory";
import { zValidator } from "@hono/zod-validator";
import { getUserId } from "./http_helpers";
import { z, ZodError } from "zod";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { adjustMessageCount } from "./chats_helpers";
import { MessageType } from "./messages_schema";
import { streamSSE } from "hono/streaming";
import { handleCompletion } from "./openai_completions_helpers";
import { chat as chatPrompt } from "./prompts";
import { ChatType } from "./chats_schema";
import { handleRun } from "./openai_runs_helpers";

const DEBUG = true;

type WithVariables<T, V extends object> =
  T extends Hono<infer E>
    ? Hono<{
        Bindings: E["Bindings"]; // keep the same bindings
        Variables: V; // add new variables
      }>
    : never; // if T is not Hono, return never

type HonoWithConvexExtended = WithVariables<
  HonoWithConvex<ActionCtx>,
  { userId: string }
>;

// Create a new Hono route
export const messagesRoute: HonoWithConvexExtended = new Hono();

const authMiddleware = createMiddleware(async (c, next) => {
  // --- Get ActionCtx from Hono Context ---
  const ctx: ActionCtx = c.env;

  // --- Get User ID ---
  const userId = await getUserId(ctx);
  if (!userId) {
    console.error("ERROR: Unable to get user ID");
    return c.json({ error: "Missing or invalid authorization token" }, 401);
  }

  // --- Set User ID in Context ---
  c.set("userId", userId);
  await next();
});

const createMessageSchema = z.object({
  content: z.string(),
  chatId: z.string(),
});

const updateMessageSchema = z.object({
  messageId: z.string(),
  content: z.string(),
});

type ResultType = {
  success: boolean;
  data?: any;
  error?: ZodError;
};

export const zodValidatorHook = (result: ResultType, c: Context) => {
  if (result.success) {
    return result.data;
  } else {
    const issue = result.error?.errors[0];
    const { path, message } = issue ?? {};
    const pathString = path?.join(".");

    const customMessage =
      pathString && message
        ? `${pathString}: ${message}`
        : "A data validation error occurred.";

    throw new HTTPException(400, {
      message: customMessage,
      cause: result.error,
    });
  }
};

/**
 * Get a chat by ID and check if a user is authorized to access it
 * @throws HTTPException if chat is not found or user is not authorized
 * @returns The chat if authorized
 */
async function getChat(
  ctx: ActionCtx,
  chatId: Id<"chats">,
  userId: Id<"users">,
): Promise<Doc<"chats">> {
  const chat = await ctx.runQuery(internal.chats_internals.getChatById, {
    chatId,
  });
  if (!chat) {
    throw new HTTPException(404, {
      message: "Chat not found",
    });
  }
  if (chat.userId !== userId) {
    throw new HTTPException(403, {
      message: "Not authorized to access this chat",
    });
  }
  return chat;
}

/**
 * Get a message by ID and check if it is an assistant message
 * @throws HTTPException if message is not found or is an assistant message
 * @returns The message if authorized
 */
async function getMessage(ctx: ActionCtx, messageId: Id<"messages">) {
  const message = await ctx.runQuery(
    internal.messages_internals.getMessageById,
    {
      messageId,
    },
  );
  if (!message) {
    throw new HTTPException(404, {
      message: "Message not found",
    });
  }
  if (message.role === "assistant") {
    throw new HTTPException(400, {
      message: "Cannot edit an assistant message",
    });
  }
  return message;
}

/**
 * Retrieve chat history
 */
export async function getHistory(
  ctx: ActionCtx,
  chatId: Id<"chats">,
  numMessages: number = 10, // set this to 0 to skip getting chat history
): Promise<{ messages: MessageType[] }> {
  if (DEBUG) {
    console.log("[getHistory]: Getting chat history for chat ID:", chatId);
  }

  const messages: MessageType[] = [];

  if (numMessages > 0) {
    // Get chat history
    const paginatedMessages = await ctx.runQuery(
      internal.messages_internals.getAllMessages,
      {
        paginationOpts: {
          numItems: numMessages,
          cursor: null,
        },
        chatId,
        sortOrder: "desc",
      },
    );

    const { page: chatHistory } = paginatedMessages;
    messages.push(...chatHistory.reverse());

    if (DEBUG) {
      console.log("[getHistory]: Chat history:", messages);
    }
  }

  return { messages };
}

function getChatCompletionAndStream(
  c: Context,
  ctx: ActionCtx,
  userId: Id<"users">,
  messages: MessageType[],
  chat: Doc<"chats">,
) {
  return streamSSE(c, async (stream) => {
    if (DEBUG) {
      console.log("[getChatCompletionAndStream]: Streaming began!");
    }

    let fullContentSoFar = "";

    await handleCompletion(
      ctx,
      userId,
      // messages
      [
        {
          role: "system",
          content: chatPrompt.system,
        },
        ...messages,
      ],
      // onContentChunk
      async (chunk: string) => {
        fullContentSoFar += chunk;
        await stream.writeSSE({
          data: chunk,
        });
      },
      // onError
      async (error: string) => {
        await stream.writeSSE({
          data: `[ERROR] : ${error}`,
        });
      },
      // onDone
      async () => {
        await stream.writeSSE({
          data: "[DONE]",
        });
        // Skips the OpenAI message creation if the chat has no OpenAI thread ID
        await ctx.runMutation(
          internal.messages_internals.createMessageAdjustCountAndUpdateThread,
          {
            role: "assistant",
            content: fullContentSoFar,
            userId,
            chat,
          },
        );
      },
    );
  });
}

function runThreadAndStream(
  c: Context,
  ctx: ActionCtx,
  userId: Id<"users">,
  chat: Doc<"chats">,
) {
  return streamSSE(c, async (stream) => {
    const assistant = await ctx.runQuery(
      internal.assistants_internals.getAssistantById,
      {
        assistantId: chat.assistantId as Id<"assistants">,
      },
    );
    if (!assistant) {
      throw new HTTPException(404, {
        message: "Assistant not found",
      });
    }

    let fullContentSoFar = "";

    await handleRun(
      ctx,
      chat.openaiThreadId as string,
      assistant.openaiAssistantId as string,
      userId,
      // onContentChunk
      async (contentChunk: string) => {
        fullContentSoFar += contentChunk;
        await stream.writeSSE({
          data: contentChunk,
        });
        // Add a small delay to ensure proper streaming
        await new Promise((resolve) => setTimeout(resolve, 10));
      },
      // onError
      async (error: string) => {
        await stream.writeSSE({
          data: error,
        });
      },
      // onDone
      async () => {
        await stream.writeSSE({
          data: "[DONE]",
        });
        await ctx.runMutation(
          internal.messages_internals.createMessageAdjustCountAndUpdateThread,
          {
            role: "assistant",
            content: fullContentSoFar,
            userId: userId,
            chat: chat,
          },
        );
      },
    );
  });
}

// Define the route handler
messagesRoute.post(
  "/messages",
  authMiddleware,
  zValidator("json", createMessageSchema, zodValidatorHook),
  async (c) => {
    if (DEBUG) {
      console.log("[POST messages]: Starting messages route");
    }

    // --- Get ActionCtx from Hono Context ---
    const ctx: ActionCtx = c.env;

    // --- Get User ID ---
    const userId = c.get("userId");
    if (DEBUG) {
      console.log("[POST messages]: User ID:", userId);
    }

    // --- Get Request Body ---
    const { content, chatId } = c.req.valid("json");
    if (DEBUG) {
      console.log("[POST messages]: Request Body:", { content, chatId });
    }

    // --- Check Chat Authorization and get chat ---
    const chat = await getChat(
      ctx,
      chatId as Id<"chats">,
      userId as Id<"users">,
    );

    // --- Create Message ---
    // skips the OpenAI message creation if the chat has no OpenAI thread ID
    const messageId = await ctx.runMutation(
      internal.messages_internals.createMessageAdjustCountAndUpdateThread,
      {
        role: "user",
        content,
        userId: userId as Id<"users">,
        chat,
      },
    );

    if (chat.assistantId) {
      // --- Run the thread with the assistant ---
      return runThreadAndStream(c, ctx, userId as Id<"users">, chat);
    } else {
      // --- Get conversation history ---
      const history = await getHistory(ctx, chatId as Id<"chats">, 10);
      // --- Get the chat completion ---
      return getChatCompletionAndStream(
        c,
        ctx,
        userId as Id<"users">,
        history.messages,
        chat,
      );
    }
  },
);

messagesRoute.patch(
  "/messages",
  authMiddleware,
  zValidator("json", updateMessageSchema, zodValidatorHook),
  async (c) => {
    if (DEBUG) {
      console.log("[PATCH messages]: Starting messages route");
    }

    // --- Get ActionCtx from Hono Context ---
    const ctx: ActionCtx = c.env;

    // --- Get User ID ---
    const userId = c.get("userId");
    if (DEBUG) {
      console.log("[PATCH messages]: User ID:", userId);
    }

    // --- Get Request Body ---
    const { messageId, content } = c.req.valid("json");
    if (DEBUG) {
      console.log("[PATCH messages]: Request Body:", { messageId, content });
    }

    // --- Get Message ---
    const message = await getMessage(ctx, messageId as Id<"messages">);

    // --- Check Chat Authorization and get chat ---
    const chat = await getChat(ctx, message.chatId, userId as Id<"users">);

    // --- Update Message ---
    await ctx.runMutation(internal.messages_internals.updateMessage, {
      messageId: messageId as Id<"messages">,
      content,
    });

    // TODO: Delete all messages after the updated message
  },
);

export const jsonResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.unknown(),
  meta: z.unknown().optional(),
});

export type JsonResponseType = z.infer<typeof jsonResponseSchema>;

// Error handling
messagesRoute.onError((err, c) => {
  console.error("Caught error:", err);

  if (err instanceof HTTPException) {
    return c.json<JsonResponseType>(
      {
        success: false,
        message: err.message,
        meta: err.cause ?? undefined,
      },
      err.status,
    );
  } else {
    return c.json<JsonResponseType>(
      {
        success: false,
        message: "An unexpected error occurred",
      },
      500,
    );
  }
});
