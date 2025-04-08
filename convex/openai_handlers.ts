/******************************************************************************
 * OPENAI COMPLETION ROUTE HANDLER
 *
 * Handles streaming AI responses for various tasks
 ******************************************************************************/
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { HonoWithConvex } from "convex-helpers/server/hono";
import { Id } from "./_generated/dataModel";
import { ActionCtx } from "./_generated/server";

import { prompts } from "./prompts";
import { getCompletion } from "./openai_helpers";
import { MessageType } from "./openai_schema";
import { getCardSamplesForContext } from "./cards_helpers";
import { getMessageSamplesForContext } from "./chats_helpers";

const DEBUG = false;

// Bind ActionCtx to Hono
export const completionRoute: HonoWithConvex<ActionCtx> = new Hono();
// Now anywhere we have a `c: Context` (from Hono) we can use `ctx: ActionCtx = c.env` to access the Convex ActionCtx

/**
 * Completion Route Handler for AI tasks
 */
completionRoute.post(
  "/completion",
  zValidator(
    "json",
    z.object({
      text: z.string().optional(),
      task: z.string(),
      context: z.record(z.any()).optional(),
      customPrompt: z.string().optional(),
    }),
  ),
  async (c) => {
    try {
      const ctx: ActionCtx = c.env;

      // When we make a request from the client, we need add bearer token to the request headers.
      // When you send a JWT token in the Authorization header, Convex automatically validates it and
      // makes the user identity available through ctx.auth.getUserIdentity()
      const identity = await ctx.auth.getUserIdentity();

      if (!identity) {
        console.error("ERROR: Missing or invalid authorization token");
        return c.json({ error: "Missing or invalid authorization token" }, 401);
      }

      if (DEBUG) {
        const { tokenIdentifier, subject, issuer } = identity;
        console.log("DEBUG: identity", {
          tokenIdentifier,
          subject,
          issuer,
        });
      }

      const { text, task, context, customPrompt } = c.req.valid("json");

      // Unified validation
      if (!(task in prompts)) {
        console.error(`ERROR: Invalid or unknown task type received: ${task}`);
        return c.json({ error: "Invalid task type" }, 400);
      }
      const validTask = task as keyof typeof prompts;
      const taskDefinition = prompts[validTask];

      // Custom prompt validation
      if (
        validTask === "custom" &&
        (typeof customPrompt !== "string" || !customPrompt.trim())
      ) {
        console.error(
          "ERROR: Missing or invalid custom prompt for custom task",
        );
        return c.json({ error: "Missing or invalid custom prompt" }, 400);
      }

      if (DEBUG) {
        console.log("DEBUG: completion HTTP action called");
        console.log("DEBUG: ", {
          text,
          task: validTask,
          context,
          customPrompt,
        });
      }

      // --- Prepare Context and Arguments ---
      let userFunctionArgs: any = {};
      const systemPrompt = taskDefinition.system;
      const userPromptFunction = taskDefinition.user;

      // Identify task type for data fetching
      const isDeckGenerationTask = [
        "generateTitleFromCards",
        "generateDescriptionFromCards",
        "generateTagsFromCards",
      ].includes(validTask);
      const isChatGenerationTask = [
        "generateTitleFromMessages",
        "generateDescriptionFromMessages",
        "generateTagsFromMessages",
      ].includes(validTask);

      // --- Fetch Context Data ---
      let dynamicContext = {};
      if (isDeckGenerationTask) {
        if (!context?.deckId) {
          console.error(
            `ERROR: Missing deckId in context for task: ${validTask}`,
          );
          return c.json({ error: "Missing deckId" }, 400);
        }

        const deckId = context.deckId as Id<"decks">;
        const cardSamples = await getCardSamplesForContext(ctx, deckId);
        dynamicContext = { cardSamples };
        if (DEBUG)
          console.log(
            `DEBUG: Fetched ${cardSamples.length} card samples for deck ${deckId}`,
          );
      } else if (isChatGenerationTask) {
        if (!context?.chatId) {
          console.error(
            `ERROR: Missing chatId in context for task: ${validTask}`,
          );
          return new Response(JSON.stringify({ error: "Missing chatId" }), {
            status: 400,
          });
        }
        const chatId = context.chatId as Id<"chats">;
        const messageSamples = await getMessageSamplesForContext(ctx, chatId);
        dynamicContext = { messageSamples };
        if (DEBUG)
          console.log(
            `DEBUG: Fetched ${messageSamples.length} message samples for chat ${chatId}`,
          );
      }
      // --- End Fetch Context Data ---

      // --- Construct User Prompt Arguments ---
      if (validTask === "custom") {
        userFunctionArgs = {
          text,
          prompt: customPrompt,
          context: { ...context, ...dynamicContext },
        };
      } else {
        // For generation tasks, primary input is the fetched context
        // For other tasks, primary input is 'text'
        // Combine provided context with fetched context
        userFunctionArgs = { text, context: { ...context, ...dynamicContext } };
      }
      // --- End Construct User Prompt Arguments ---

      if (DEBUG) {
        console.log("DEBUG: System Prompt:", systemPrompt);
        console.log("DEBUG: User Function Arguments:", userFunctionArgs); // Check the combined context
      }

      // Create the messages array
      const messages: MessageType[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPromptFunction(userFunctionArgs) },
      ];

      if (DEBUG) {
        console.log("DEBUG: messages", messages);
      }

      // Call the OpenAI API
      const result = await getCompletion(messages);

      return result.toDataStreamResponse();
    } catch (error) {
      console.error("Error", error);
      // FIXME: if the token is expired I get
      // [Error: Expired: ID token expired at 2025-04-05 05:21:50 UTC (current time is 2025-04-08 03:16:02.974724219 UTC)]
      // But I'm not able to paarse the message and show 401 to the client
      return c.json({ error: "Internal server error" }, 500);
    }
  },
);
