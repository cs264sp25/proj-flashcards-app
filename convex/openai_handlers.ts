/******************************************************************************
 * OPENAI COMPLETION ROUTE HANDLER
 *
 * Handles streaming AI responses for various tasks
 ******************************************************************************/
import { Hono } from "hono";
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
  async (c) => {
    try {
      const ctx: ActionCtx = c.env;
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

      // --- Get Raw Request Body --- 
      // We will validate this against the specific task's schema
      const rawRequestBody = await c.req.json();
      if (DEBUG) console.log("DEBUG: Raw Request Body:", rawRequestBody);

      // --- Basic Task Validation --- 
      const task = rawRequestBody?.task;
      if (!task || typeof task !== "string" || !(task in prompts)) {
        console.error(`ERROR: Invalid or missing task type received: ${task}`);
        return c.json({ error: "Invalid or missing task type" }, 400);
      }
      const validTask = task as keyof typeof prompts;
      const taskDefinition = prompts[validTask];

      // --- Schema-based Validation --- 
      const validationResult = taskDefinition.inputSchema.safeParse(rawRequestBody);

      if (!validationResult.success) {
        console.error(
          `ERROR: Input validation failed for task '${validTask}':`,
          validationResult.error.flatten(),
        );
        return c.json(
          { error: "Invalid input for the specified task", details: validationResult.error.flatten() },
          400,
        );
      }

      // --- Input data is now validated and typed! --- 
      const validatedInput = validationResult.data;
      if (DEBUG) console.log("DEBUG: Validated Input:", validatedInput);

      // --- Prepare Arguments for User Prompt Function --- 
      const systemPrompt = taskDefinition.system;
      const userPromptFunction = taskDefinition.user;
      let userFunctionArgs: any = { ...validatedInput }; // Start with validated data

      // --- Fetch Context Data (Conditional) --- 
      // Check if the validated input requires fetching samples
      if (
        "context" in validatedInput &&
        validatedInput.context &&
        "deckId" in validatedInput.context
      ) {
        const deckId = validatedInput.context.deckId as Id<"decks">;
        const cardSamples = await getCardSamplesForContext(ctx, deckId);
        userFunctionArgs.cardSamples = cardSamples; // Add fetched samples
        if (DEBUG)
          console.log(
            `DEBUG: Fetched ${cardSamples.length} card samples for deck ${deckId}`,
          );
      } else if (
        "context" in validatedInput &&
        validatedInput.context &&
        "chatId" in validatedInput.context
      ) {
        const chatId = validatedInput.context.chatId as Id<"chats">;
        const messageSamples = await getMessageSamplesForContext(ctx, chatId);
        userFunctionArgs.messageSamples = messageSamples; // Add fetched samples
        if (DEBUG)
          console.log(
            `DEBUG: Fetched ${messageSamples.length} message samples for chat ${chatId}`,
          );
      }
      // --- End Fetch Context Data ---

      if (DEBUG) {
        console.log("DEBUG: System Prompt:", systemPrompt);
        console.log("DEBUG: Final User Function Arguments:", userFunctionArgs);
      }

      // --- Create Messages for OpenAI --- 
      const messages: MessageType[] = [
        { role: "system", content: systemPrompt },
        // Pass the potentially augmented arguments (with samples) to the user function
        // Type safety is ensured by the checks and schema validation above
        { role: "user", content: userPromptFunction(userFunctionArgs) },
      ];

      if (DEBUG) {
        console.log("DEBUG: OpenAI messages:", messages);
      }

      // --- Call OpenAI and Stream Response --- 
      const result = await getCompletion(messages);
      return result.toDataStreamResponse();

    } catch (error) {
      console.error("Error in /completion handler:", error);
      // Consider more specific error handling (e.g., ZodError vs. other errors)
      return c.json({ error: "Internal server error" }, 500);
    }
  },
);
