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
import { z } from "zod";
import { internal } from "./_generated/api";
import OpenAI from "openai";
import { stream, streamText, streamSSE } from 'hono/streaming'

const DEBUG = true;

// Bind ActionCtx to Hono
export const completionRoute: HonoWithConvex<ActionCtx> = new Hono();
// Now anywhere we have a `c: Context` (from Hono) we can use `ctx: ActionCtx = c.env` to access the Convex ActionCtx

/**
 * Completion Route Handler for AI tasks
 */
completionRoute.post("/completion", async (c) => {
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
    const validationResult =
      taskDefinition.inputSchema.safeParse(rawRequestBody);

    if (!validationResult.success) {
      console.error(
        `ERROR: Input validation failed for task '${validTask}':`,
        validationResult.error.flatten(),
      );
      return c.json(
        {
          error: "Invalid input for the specified task",
          details: validationResult.error.flatten(),
        },
        400,
      );
    }

    // --- Input data is now validated and typed! ---
    const validatedInput = validationResult.data;
    if (DEBUG) console.log("DEBUG: Validated Input:", validatedInput);

    // --- Prepare Arguments for User Prompt Function ---
    const systemPrompt = taskDefinition.system;
    const userPromptFunction = taskDefinition.user;
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
});

export const chatRoute: HonoWithConvex<ActionCtx> = new Hono();

chatRoute.post("/chat", async (c) => {
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

  // --- Schema-based Validation ---
  const chatRequestBodySchema = z.object({
    // Define the schema for the chat request body
    // This should match the expected structure of the request
    content: z.string(),
    chatId: z.string(),
  });
  // Validate the raw request body against the schema
  // This will ensure that the request body has the correct structure and types
  const validationResult = chatRequestBodySchema.safeParse(rawRequestBody);
  if (!validationResult.success) {
    console.error(
      `ERROR: Input validation failed for chat request:`,
      validationResult.error.flatten(),
    );
    return c.json(
      {
        error: "Invalid input for the chat request",
        details: validationResult.error.flatten(),
      },
      400,
    );
  }
  // --- Input data is now validated and typed! ---
  const { content, chatId } = validationResult.data;
  const chat = await ctx.runQuery(internal.chats_internals.getChatById, {
    chatId: chatId as Id<"chats">,
  });

  if (!chat) {
    return c.json(
      { error: "Chat not found" },
      404,
    );
  }

  if (!chat.openaiThreadId || !chat.assistantId) {
    return c.json(
      { error: "Chat does not have an OpenAI thread ID or assistant ID" },
      400,
    );
  }


  const threadId = chat.openaiThreadId;
  let assistantId: string | undefined = "";

    const assistant = await ctx.runQuery(
      internal.assistants_internals.getAssistantById,
      {
        assistantId: chat?.assistantId as Id<"assistants">,
      },
    );

  if (!assistant) {
    return c.json(
      { error: "Assistant not found" },
      404,
    );
  }

  if (!assistant.openaiAssistantId) {
    return c.json(
      { error: "Assistant does not have an OpenAI assistant ID" },
      400,
    );
  }

  assistantId = assistant.openaiAssistantId;

  // Instantiate the OpenAI API client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  // Create a streaming run
  const response = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    stream: true,
  });

  return stream(c, async (stream) => {
    await stream.pipe(response.toReadableStream())
  })
});
