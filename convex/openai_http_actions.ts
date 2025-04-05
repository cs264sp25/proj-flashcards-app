/******************************************************************************
 * HTTP ACTIONS
 *
 * HTTP actions for AI operations:
 * - completion: Handles streaming AI responses for various tasks
 *   - Includes helper functions for fetching and sampling card and message data
 ******************************************************************************/
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

import { prompts } from "./prompts";
import { getCompletion } from "./openai_helpers";
import { MessageType } from "./openai_schema";
import { ActionCtx } from "./_generated/server";

const DEBUG = true;
const MAX_CARD_CONTENT_CHARS = 10000; // Approx 2500 tokens for cards
const MAX_MESSAGE_CONTENT_CHARS = 10000; // Approx 2500 tokens for messages, adjust as needed

// --- Helper Function to Fetch and Sample Card Data ---
async function getCardSamplesForContext(
  ctx: ActionCtx,
  deckId: Id<"decks">,
): Promise<{ front: string; back?: string }[]> {
  try {
    // Assume getDeckById returns an object with cardCount or similar
    const deck = await ctx.runQuery(internal.decks_internals.getDeckById, {
      deckId,
    });
    const numCardsToFetch = deck?.cardCount || 100; // Fetch all or a reasonable max

    // Assume getAllCards takes pagination opts
    const paginatedCards = await ctx.runQuery(
      internal.cards_internals.getAllCards,
      {
        deckId,
        paginationOpts: { numItems: numCardsToFetch, cursor: null },
      },
    );
    const { page: cards } = paginatedCards;

    if (!cards || cards.length === 0) return [];

    let accumulatedChars = 0;
    const samples: { front: string; back?: string }[] = [];
    for (const card of cards) {
      const frontChars = card.front?.length || 0;
      const backChars = card.back?.length || 0;
      const cardChars = frontChars + backChars;
      if (
        accumulatedChars + cardChars > MAX_CARD_CONTENT_CHARS &&
        samples.length > 0
      ) {
        if (DEBUG)
          console.log(
            `DEBUG (Cards): Reached char limit (${accumulatedChars}), sampled ${samples.length} cards.`,
          );
        break;
      }
      samples.push({ front: card.front, back: card.back });
      accumulatedChars += cardChars;
    }
    if (DEBUG && samples.length === cards.length)
      console.log(
        `DEBUG (Cards): Included all ${samples.length} cards (${accumulatedChars} chars).`,
      );
    return samples;
  } catch (error) {
    console.error(`Error fetching cards for deck ${deckId}:`, error);
    return [];
  }
}
// --- End Card Helper ---

// --- Helper Function to Fetch and Sample Message Data ---
async function getMessageSamplesForContext(
  ctx: ActionCtx,
  chatId: Id<"chats">,
): Promise<{ role: string; content: string }[]> {
  try {
    // Assume getChatById returns an object with messageCount or similar
    const chat = await ctx.runQuery(internal.chats_internals.getChatById, {
      // Adjust if needed
      chatId,
    });
    // Fetch a reasonable number of latest messages, or all if count is low
    const numMessagesToFetch = chat?.messageCount || 100; // Adjust limit as needed

    // Assume getAllMessages takes chatId and pagination opts (fetching latest)
    // You might need to adjust the query/index for fetching latest messages efficiently
    const paginatedMessages = await ctx.runQuery(
      internal.messages_internals.getAllMessages, // Adjust if needed
      {
        chatId,
        paginationOpts: { numItems: numMessagesToFetch, cursor: null }, // Might need sorting/cursor logic for "latest"
      },
    );
    // Assuming page contains message objects with { role: string, content: string }
    // Reverse the page to get chronological order if fetched in reverse
    const messages = paginatedMessages.page.reverse(); // Or adjust query order

    if (!messages || messages.length === 0) return [];

    let accumulatedChars = 0;
    const samples: { role: string; content: string }[] = [];
    // Iterate backwards through messages (most recent first) for sampling
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      // Ensure content is a string, handle potential non-string content types if necessary
      const contentString =
        typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content);
      const messageChars = contentString.length || 0;

      if (
        accumulatedChars + messageChars > MAX_MESSAGE_CONTENT_CHARS &&
        samples.length > 0
      ) {
        if (DEBUG)
          console.log(
            `DEBUG (Messages): Reached char limit (${accumulatedChars}), sampled ${samples.length} messages.`,
          );
        break; // Stop adding older messages
      }
      // Add message to the beginning of samples to maintain chronological order for the AI
      samples.unshift({ role: message.role, content: contentString });
      accumulatedChars += messageChars;
    }

    if (DEBUG && samples.length === messages.length)
      console.log(
        `DEBUG (Messages): Included all ${samples.length} messages (${accumulatedChars} chars).`,
      );
    return samples; // Return chronologically ordered samples
  } catch (error) {
    console.error(`Error fetching messages for chat ${chatId}:`, error);
    return [];
  }
}
// --- End Message Helper ---

// --- Completion HTTP Action ---
export const completion = httpAction(async (ctx, request) => {
  const body = await request.json();
  // Expect deckId OR chatId potentially
  const { text, task, context, customPrompt } = body as {
    text?: string;
    task: string;
    context?: Record<string, any> & { deckId?: string; chatId?: string };
    customPrompt?: string;
  };

  // Unified validation
  if (!(task in prompts)) {
    console.error(`ERROR: Invalid or unknown task type received: ${task}`);
    return new Response(JSON.stringify({ error: "Invalid task type" }), {
      status: 400,
    });
  }
  const validTask = task as keyof typeof prompts;
  const taskDefinition = prompts[validTask];

  // Custom prompt validation
  if (
    validTask === "custom" &&
    (typeof customPrompt !== "string" || !customPrompt.trim())
  ) {
    console.error("ERROR: Missing or invalid custom prompt for custom task");
    return new Response(
      JSON.stringify({ error: "Missing or invalid custom prompt" }),
      { status: 400 },
    );
  }

  if (DEBUG) {
    console.log("DEBUG: completion HTTP action called");
    console.log("DEBUG: ", { text, task: validTask, context, customPrompt });
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
      console.error(`ERROR: Missing deckId in context for task: ${validTask}`);
      return new Response(JSON.stringify({ error: "Missing deckId" }), {
        status: 400,
      });
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
      console.error(`ERROR: Missing chatId in context for task: ${validTask}`);
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

  return result.toDataStreamResponse({
    headers: { "Access-Control-Allow-Origin": "*" },
  });
});
// --- End Completion HTTP Action ---
