/******************************************************************************
 * AI TASK COMPLETIONS ROUTE HANDLER
 *
 * Handles streaming AI responses for various tasks
 ******************************************************************************/
import { Hono } from "hono";
import { HonoWithConvex } from "convex-helpers/server/hono";
import { Id } from "./_generated/dataModel";
import { ActionCtx } from "./_generated/server";
import { streamSSE } from "hono/streaming";

import { prompts } from "./prompts";
import { handleCompletion } from "./openai_completions_helpers";
import { MessageType } from "./openai_schema";
import { getCardSamplesForContext } from "./cards_helpers";
import { getMessageSamplesForContext } from "./chats_helpers";
import { getUserId } from "./http_helpers";

const DEBUG = true;

// Bind ActionCtx to Hono
export const tasksCompletionsRoute: HonoWithConvex<ActionCtx> = new Hono();
// Now anywhere we have a `c: Context` (from Hono) we can use `ctx: ActionCtx = c.env` to access the Convex ActionCtx

/**
 * Validate request body against schema
 */
function validateRequestBody(rawRequestBody: Record<string, string>) {
  // --- Basic Task Validation ---
  const task = rawRequestBody?.task;
  if (!task || typeof task !== "string" || !(task in prompts)) {
    return {
      success: false,
      error: "Invalid or missing task type",
      status: 400,
      details: `Invalid or missing task type received: ${task}`,
    };
  }
  const validTask = task as keyof typeof prompts;
  const taskDefinition = prompts[validTask];

  // --- Schema-based Validation ---
  const validationResult = taskDefinition.inputSchema.safeParse(rawRequestBody);

  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid input for the specified task",
      status: 400,
      details: validationResult.error.flatten(),
    };
  }

  return {
    success: true,
    data: validationResult.data,
    taskDefinition,
  };
}

/**
 * Prepare messages with context data if needed
 */
async function prepareMessages(
  ctx: ActionCtx,
  validatedInput: any,
  systemPrompt: string,
  userPromptFunction: (args: any) => string,
): Promise<MessageType[]> {
  const userFunctionArgs: any = { ...validatedInput }; // Start with validated data

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
    if (DEBUG) {
      console.log(
        `[prepareMessages]: Fetched ${cardSamples.length} card samples for deck ${deckId}`,
      );
    }
  } else if (
    "context" in validatedInput &&
    validatedInput.context &&
    "chatId" in validatedInput.context
  ) {
    const chatId = validatedInput.context.chatId as Id<"chats">;
    const messageSamples = await getMessageSamplesForContext(ctx, chatId);
    userFunctionArgs.messageSamples = messageSamples; // Add fetched samples
    if (DEBUG) {
      console.log(
        `[prepareMessages]: Fetched ${messageSamples.length} message samples for chat ${chatId}`,
      );
    }
  }
  // --- End Fetch Context Data ---

  if (DEBUG) {
    console.log("[prepareMessages]: System Prompt:", systemPrompt);
    console.log("[prepareMessages]: Final User Function Arguments:", userFunctionArgs);
  }

  // --- Create Messages for OpenAI ---
  const messages: MessageType[] = [
    { role: "system", content: systemPrompt },
    // Pass the potentially augmented arguments (with samples) to the user function
    // Type safety is ensured by the checks and schema validation above
    { role: "user", content: userPromptFunction(userFunctionArgs) },
  ];

  if (DEBUG) {
    console.log("[prepareMessages]: Messages:", messages);
  }

  return messages;
}

/**
 * Completion Route Handler for AI tasks
 */
tasksCompletionsRoute.post("/tasks/completions", async (c) => {
  try {
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
      console.log("[tasksCompletionsHandler]: Raw Request Body:", rawRequestBody);
    }

    // --- Validate Request Body ---
    const validationResult = validateRequestBody(rawRequestBody);
    if (!validationResult.success) {
      console.error(`ERROR: ${validationResult.details}`);
      return c.json(
        { error: validationResult.error, details: validationResult.details },
        400,
      );
    }

    // --- Input data is now validated and typed! ---
    const validatedInput = validationResult.data!;
    const taskDefinition = validationResult.taskDefinition!;
    if (DEBUG) console.log("[tasksCompletionsHandler]: Validated Input:", validatedInput);

    // --- Prepare Arguments for User Prompt Function ---
    const systemPrompt = taskDefinition.system;
    const userPromptFunction = taskDefinition.user;

    // --- Prepare Messages ---
    const messages = await prepareMessages(
      ctx,
      validatedInput,
      systemPrompt,
      userPromptFunction,
    );

    // --- Handle Completion with SSE ---
    return streamSSE(c, async (stream) => {
      await handleCompletion(
        ctx,
        userId,
        messages,
        // onContentChunk
        async (chunk: string) => {
          await stream.writeSSE({
            data: chunk,
          });
        },
        // onError
        async (error: string) => {
          // await stream.writeSSE({
          //   data: `[ERROR] : ${error}`,
          // });
        },
        // onDone
        async () => {
          // await stream.writeSSE({
          //   data: "[DONE]",
          // });
        },
      );
    });
  } catch (error) {
    console.error("Error in /completion handler:", error);
    // Consider more specific error handling (e.g., ZodError vs. other errors)
    return c.json({ error: "Internal server error" }, 500);
  }
});
