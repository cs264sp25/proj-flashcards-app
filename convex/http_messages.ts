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
    const messageId = await ctx.runMutation(
      internal.messages_internals.createMessage,
      {
        role: "user",
        message: {
          content,
          chatId: chatId as Id<"chats">,
        },
      },
    );

    // --- Adjust Message Count ---
    // TODO: Implement this
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
    const chat = await getChat(
      ctx,
      message.chatId,
      userId as Id<"users">,
    );

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
