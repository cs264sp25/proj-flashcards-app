import { HonoWithConvex } from "convex-helpers/server/hono";
import { ActionCtx } from "./_generated/server";
import { Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { createMiddleware } from "hono/factory";
import { zValidator } from "@hono/zod-validator";
import { getUserId } from "./http_helpers";
import { z, ZodError } from "zod";

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

// Define the route handler
messagesRoute.post(
  "/messages",
  authMiddleware,
  zValidator("json", createMessageSchema, zodValidatorHook),
  async (c) => {
    try {
      if (DEBUG) {
        console.log("[POST messages]: Starting messages route");
      }

      // --- Get ActionCtx from Hono Context ---
      const ctx: ActionCtx = c.env;

      // --- Get User ID ---
      const userId = c.get("userId");

      // --- Get Request Body ---
      const { content, chatId } = c.req.valid("json");
    } catch (error) {
      console.error("Error creating message:", error);
      return c.json({ error: "Failed to create message" }, 500);
    }
  },
);

messagesRoute.patch(
  "/messages",
  authMiddleware,
  zValidator("json", updateMessageSchema, zodValidatorHook),
  async (c) => {
    try {
      if (DEBUG) {
        console.log("[PATCH messages]: Starting messages route");
      }

      // --- Get ActionCtx from Hono Context ---
      const ctx: ActionCtx = c.env;

      // --- Get User ID ---
      const userId = c.get("userId");

      // --- Get Request Body ---
      const { messageId, content } = c.req.valid("json");
    } catch (error) {
      console.error("Error editing message:", error);
      return c.json({ error: "Failed to edit message" }, 500);
    }
  },
);
