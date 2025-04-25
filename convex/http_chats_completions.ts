/******************************************************************************
 * HTTP Handler with OpenAI SDK
 *
 * This file implements the completion action using OpenAI's SDK directly,
 * instead of using Vercel's AI SDK.
 ******************************************************************************/

import { ActionCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

import { Hono } from "hono";
import { HonoWithConvex } from "convex-helpers/server/hono";
import { streamSSE } from "hono/streaming";

import { chat } from "./prompts";
import { handleCompletion } from "./openai_completions_helpers";
import { getUserId } from "./http_helpers";
import { validateRequestBody, getMessageAndHistory } from "./http_chats_helper";

const DEBUG = true;

// Create a new Hono route
export const chatsCompletionsRoute: HonoWithConvex<ActionCtx> = new Hono();

// Define the route handler
chatsCompletionsRoute.post("/chats/completions", async (c) => {
  try {
    if (DEBUG) {
      console.log("[chatsCompletionsHandler]: Starting ai/chats/completions route");
    }

    // --- Get ActionCtx from Hono Context ---
    const ctx: ActionCtx = c.env;

    // --- Get User ID ---
    const userId = await getUserId(ctx);
    if (!userId) {
      console.error("ERROR: Unable to get user ID");
      return c.json({ error: "Missing or invalid authorization token" }, 401);
    }

    // --- Get Raw Request Body ---
    const rawRequestBody = await c.req.json();
    if (DEBUG) {
      console.log("[chatsCompletionsHandler]: Raw Request Body:", rawRequestBody);
    }

    // --- Schema-based Validation ---
    const validationResult = validateRequestBody(rawRequestBody);
    if (!validationResult.success) {
      console.error(
        `ERROR: Input validation failed for direct completion request:`,
        validationResult.error.flatten(),
      );
      return c.json(
        {
          error: "Invalid input for the direct completion request",
          details: validationResult.error.flatten(),
        },
        400,
      );
    }
    const { messageId } = validationResult.data;

    if (DEBUG) {
      console.log("[chatsCompletionsHandler]: Message ID:", messageId);
    }

    // Get message and chat history
    const { message, messages } = await getMessageAndHistory(
      ctx,
      messageId as Id<"messages">,
    );

    if (DEBUG) {
      console.log("[chatsCompletionsHandler]: Message:", message);
      console.log("[chatsCompletionsHandler]: Messages:", messages);
    }

    // --- Handle Completion with SSE ---
    return streamSSE(c, async (stream) => {
      if (DEBUG) {
        console.log("[chatsCompletionsHandler]: Streaming from ai/chats/completions route");
      }

      await handleCompletion(
        ctx,
        userId,
        // messages
        [
          {
            role: "system",
            content: chat.system,
          },
          ...messages,
        ],
        // onContentChunk
        async (chunk: string) => {
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
        },
      );
    });
  } catch (error) {
    console.error("Error in direct completion:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
