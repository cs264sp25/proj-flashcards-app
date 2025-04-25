/******************************************************************************
 * OPENAI COMPLETION ROUTE HANDLER
 *
 * Handles streaming AI responses for various tasks
 ******************************************************************************/

import { Id } from "./_generated/dataModel";
import { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { HonoWithConvex } from "convex-helpers/server/hono";

import { getUserId } from "./http_helpers";
import { getMessageAndHistory, validateRequestBody } from "./http_chats_helper";
import { handleRun } from "./openai_runs_helpers";
import { prepareForRun } from "./openai_runs_helpers";

const DEBUG = true;

export const chatsAssistantsRoute: HonoWithConvex<ActionCtx> = new Hono();

chatsAssistantsRoute.post("/chats/assistants", async (c) => {
  try {
    if (DEBUG) {
      console.log("[chatsAssistantsHandler]: Starting ai/chats/assistants route");
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
      console.log("[chatsAssistantsHandler]: Raw Request Body:", rawRequestBody);
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
      console.log("[chatsAssistantsHandler]: Message ID:", messageId);
    }

    // Get message and chat history
    const { message } = await getMessageAndHistory(
      ctx,
      messageId as Id<"messages">,
      0, // set this to 0 to skip getting chat history
    );

    if (DEBUG) {
      console.log("[chatsAssistantsHandler]: Message:", message);
    }

    const { openaiThreadId, openaiAssistantId } = await prepareForRun(
      ctx,
      message,
    );

    if (!openaiThreadId || !openaiAssistantId) {
      if (DEBUG) {
        console.log("[chatsAssistantsHandler]: No OpenAI thread ID or assistant ID");
        console.log("[chatsAssistantsHandler]: Redirecting to ai/chats/completions endpoint");
      }

      // Redirect to chats/completions endpoint
      return c.redirect(`/ai/chats/completions`, 307);
    }

    return streamSSE(c, async (stream) => {
      let fullContentSoFar = "";

      await handleRun(
        ctx,
        openaiThreadId,
        openaiAssistantId,
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
          await ctx.runMutation(internal.messages_internals.createMessageAndUpdateThread, {
            role: "assistant",
            content: fullContentSoFar,
            userId: userId,
            chatId: message.chatId,
          });
        },
      );
    });
  } catch (error) {
    console.error("Error in chat handler:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
