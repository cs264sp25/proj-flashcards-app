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
import { MessageType } from "./messages_schema";
import { streamSSE } from "hono/streaming";
import { handleCompletion } from "./openai_completions_helpers";
import { chat as chatPrompt } from "./prompts";
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
async function getChatAndAuthorizeUser(
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
 * Get a message by ID and ensure it exists
 * @throws HTTPException if message is not found
 * @returns The message
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
  chatId: Id<"chats">,
  openaiThreadId: string | null,
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
        const convexMessageId = await ctx.runMutation(
          internal.messages_internals.createMessageAndAdjustMessageCount,
          {
            role: "assistant",
            message: {
              content: fullContentSoFar,
              chatId,
            },
          },
        );

        if (openaiThreadId) {
          await ctx.scheduler.runAfter(
            0,
            internal.openai_messages.createMessage,
            {
              messageId: convexMessageId,
              openaiThreadId,
              content: fullContentSoFar,
              role: "assistant",
            },
          );
        }
      },
    );
  });
}

function runThreadAndStream(
  c: Context,
  ctx: ActionCtx,
  userId: Id<"users">,
  chatId: Id<"chats">,
  openaiAssistantId: string,
  openaiThreadId: string,
) {
  return streamSSE(c, async (stream) => {
    await handleRun(
      ctx,
      openaiThreadId,
      openaiAssistantId,
      userId,
      // onContentChunk
      async (contentChunk: string) => {
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
        // We could aggregate contentChunk in onContentChunk and then here
        // we could create the assistant message, but we'll do that in the
        // onMessageDone function instead
      },
      // onMessageDone
      async (messageId: string, messageContent: string) => {
        // messageContent should be the same as fullResponse
        const convexMessageId = await ctx.runMutation(
          internal.messages_internals.createMessageAndAdjustMessageCount,
          {
            role: "assistant",
            message: {
              content: messageContent,
              chatId,
            },
          },
        );
        // Update the placeholder message with the OpenAI message ID
        await ctx.runMutation(
          internal.messages_internals.updateOpenAIMessageId,
          {
            messageId: convexMessageId,
            openaiMessageId: messageId,
          },
        );
      },
    );
  });
}

async function createMessageRespondAndStream(
  c: Context,
  ctx: ActionCtx,
  userId: Id<"users">,
  content: string,
  chat: Doc<"chats">,
) {
  // --- Create Message ---
  const messageId = await ctx.runMutation(
    internal.messages_internals.createMessageAndAdjustMessageCount,
    {
      role: "user",
      message: {
        content,
        chatId: chat._id,
      },
    },
  );

  const openaiThreadId: string | null = chat.openaiThreadId || null;
  if (openaiThreadId) {
    // Create the user message in OpenAI
    // This will update the openaiMessageId field of the userMessageId message
    await ctx.scheduler.runAfter(0, internal.openai_messages.createMessage, {
      messageId,
      openaiThreadId,
      content,
      role: "user",
    });
  }

  let openaiAssistantId: string | null = null;
  if (chat.assistantId) {
    const assistant = await ctx.runQuery(
      internal.assistants_internals.getAssistantById,
      {
        assistantId: chat.assistantId as Id<"assistants">,
      },
    );

    openaiAssistantId = assistant.openaiAssistantId || null;
  }

  if (openaiAssistantId && openaiThreadId) {
    // --- Run the thread with the assistant ---
    return runThreadAndStream(
      c,
      ctx,
      userId as Id<"users">,
      chat._id,
      openaiAssistantId,
      openaiThreadId,
    );
  } else {
    // --- Get conversation history ---
    const history = await getHistory(ctx, chat._id, 10);
    // --- Get the chat completion ---
    return getChatCompletionAndStream(
      c,
      ctx,
      userId as Id<"users">,
      history.messages,
      chat._id,
      openaiThreadId,
    );
  }
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
    const chat = await getChatAndAuthorizeUser(
      ctx,
      chatId as Id<"chats">,
      userId as Id<"users">,
    );

    // --- Create Message and stream response ---
    return createMessageRespondAndStream(
      c,
      ctx,
      userId as Id<"users">,
      content,
      chat,
    );
  },
);

messagesRoute.patch(
  "/messages",
  authMiddleware,
  zValidator("json", updateMessageSchema, zodValidatorHook),
  async (c) => {
    if (DEBUG) {
      console.log("[PATCH messages] Starting messages route");
    }

    // Get ActionCtx from Hono Context
    const ctx: ActionCtx = c.env;

    // Get User ID from context (check authentication)
    const userId = c.get("userId");
    if (DEBUG) {
      console.log("[PATCH messages] User ID:", userId);
    }

    // Get Request Body (input validation)
    const { messageId, content } = c.req.valid("json");
    if (DEBUG) {
      console.log("[PATCH messages] Request Body:", { messageId, content });
    }

    // Fetch the original message by ID (check if it exists)
    const originalMessage = await getMessage(ctx, messageId as Id<"messages">);
    if (DEBUG) {
      console.log("[PATCH messages] Original message", originalMessage);
    }

    // Refuse to update assistant messages
    if (originalMessage.role === "assistant") {
      throw new HTTPException(400, {
        message: "Cannot edit an assistant message",
      });
    }

    // Fetch the chat and check authorization
    const chat = await getChatAndAuthorizeUser(
      ctx,
      originalMessage.chatId,
      userId as Id<"users">,
    );

    // Find all subsequent messages (after the message we are editing)
    const subsequentMessages = await ctx.runQuery(
      internal.messages_internals.getSubsequentMessages,
      {
        messageId: messageId as Id<"messages">,
      },
    );
    if (DEBUG) {
      console.log("[PATCH messages] Subsequent messages", subsequentMessages);
    }

    // Schedule deletion of this and all subsequent Convex messages
    const convexMessageIdsToDelete = [
      originalMessage._id,
      ...subsequentMessages.map((msg) => msg._id),
    ];
    if (convexMessageIdsToDelete.length > 0) {
      await ctx.scheduler.runAfter(
        0,
        internal.messages_internals.deleteMessagesByIdsAndAdjustMessageCount,
        {
          messageIds: convexMessageIdsToDelete,
          chatId: originalMessage.chatId,
        },
      );
    }

    // Schedule deletion of all relevant OpenAI messages
    const openaiMessageIdsToDelete: string[] = [];
    if (originalMessage.openaiMessageId) {
      openaiMessageIdsToDelete.push(originalMessage.openaiMessageId);
    }
    subsequentMessages.forEach((msg) => {
      if (msg.openaiMessageId) {
        openaiMessageIdsToDelete.push(msg.openaiMessageId);
      }
    });
    if (openaiMessageIdsToDelete.length > 0) {
      await ctx.scheduler.runAfter(0, internal.openai_messages.deleteMessages, {
        openaiThreadId: chat.openaiThreadId as string,
        openaiMessageIds: openaiMessageIdsToDelete,
      });
    }

    // From this point on, it is the same as the createMessage route
    return createMessageRespondAndStream(
      c,
      ctx,
      userId as Id<"users">,
      content,
      chat,
    );
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
