/******************************************************************************
 * HTTP ACTIONS
 *
 * HTTP actions for AI operations:
 * - completion: Handles streaming AI responses for various tasks
 ******************************************************************************/
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

import { prompts } from "./prompts";
import { getCompletion } from "./openai_helpers";
import { MessageType } from "./openai_schema";
import { ActionCtx } from "./_generated/server";

const DEBUG = true;
const MAX_CARD_CONTENT_CHARS = 10000; // Approx 2500 tokens, adjust as needed

// --- Helper Function to Fetch and Sample Card Data ---
async function getCardSamplesForContext(
  ctx: ActionCtx,
  deckId: Id<"decks">,
): Promise<{ front: string; back?: string }[]> {
  try {
    const deck = await ctx.runQuery(internal.decks_internals.getDeckById, {
      deckId,
    });

    const paginatedCards = await ctx.runQuery(
      internal.cards_internals.getAllCards,
      {
        deckId,
        paginationOpts: {
          numItems: deck?.cardCount || 100,
          cursor: null,
        },
      },
    );

    const { page: cards } = paginatedCards;

    if (!cards || cards.length === 0) {
      return [];
    }

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
        // Stop if adding this card exceeds the limit (and we have at least one sample)
        if (DEBUG)
          console.log(
            `DEBUG: Reached char limit (${accumulatedChars}), sampled ${samples.length} cards.`,
          );
        break;
      }

      samples.push({ front: card.front, back: card.back });
      accumulatedChars += cardChars;

      if (DEBUG && samples.length === cards.length)
        console.log(
          `DEBUG: Included all ${samples.length} cards (${accumulatedChars} chars).`,
        );
    }
    return samples;
  } catch (error) {
    console.error(`Error fetching cards for deck ${deckId}:`, error);
    return []; // Return empty array on error
  }
}
// --- End Helper Function ---

export const completion = httpAction(async (ctx, request) => {
  const body = await request.json();
  // Include deckId in context if provided
  const { text, task, context, customPrompt } = body as {
    text?: string;
    task: string;
    context?: Record<string, any> & { deckId?: string }; // Expect deckId potentially
    customPrompt?: string;
  };

  // Unified validation
  // Cast task to keyof typeof prompts after validation
  if (!(task in prompts)) {
    console.error(`ERROR: Invalid or unknown task type received: ${task}`);
    return new Response(JSON.stringify({ error: "Invalid task type" }), {
      status: 400,
    });
  }
  const validTask = task as keyof typeof prompts; // Type assertion
  const taskDefinition = prompts[validTask];

  // Validate custom prompt only if task is 'custom'
  if (
    validTask === "custom" &&
    (typeof customPrompt !== "string" || !customPrompt.trim())
  ) {
    console.error("ERROR: Missing or invalid custom prompt for custom task");
    return new Response(
      JSON.stringify({
        error: "Missing or invalid custom prompt for custom task",
      }),
      { status: 400 },
    );
  }

  if (DEBUG) {
    console.log("DEBUG: completion HTTP action called");
    console.log("DEBUG: ", { text, task: validTask, context, customPrompt });
  }

  // --- Prepare Context and Arguments ---
  let userFunctionArgs: any = {}; // Use 'any' for flexibility, or create a more specific type
  const systemPrompt = taskDefinition.system;
  const userPromptFunction = taskDefinition.user;

  // Check if it's a deck generation task
  const isDeckGenerationTask = [
    "generateTitleFromCards",
    "generateDescriptionFromCards",
    "generateTagsFromCards",
  ].includes(validTask);

  if (isDeckGenerationTask) {
    if (!context?.deckId) {
      console.error(`ERROR: Missing deckId in context for task: ${validTask}`);
      return new Response(
        JSON.stringify({ error: "Missing deckId for this task" }),
        {
          status: 400,
        },
      );
    }
    const deckId = context.deckId as Id<"decks">; // Assuming context.deckId is the string ID
    const cardSamples = await getCardSamplesForContext(ctx, deckId);
    if (DEBUG)
      console.log(
        `DEBUG: Fetched ${cardSamples.length} card samples for deck ${deckId}`,
      );

    // For generation tasks, the primary input is the context (cards)
    // We still pass `text` if available, though the prompt might ignore it
    userFunctionArgs = { text, context: { ...context, cardSamples } };
  } else if (validTask === "custom") {
    // Handle 'custom' task arguments
    userFunctionArgs = { text, prompt: customPrompt, context };
  } else {
    // Handle standard tasks arguments
    userFunctionArgs = { text, context };
  }
  // --- End Prepare Context and Arguments ---

  if (DEBUG) {
    console.log("DEBUG: System Prompt:", systemPrompt);
    // console.log("DEBUG: User Prompt Function:", userPromptFunction.toString()); // Might be too verbose
    console.log("DEBUG: User Function Arguments:", userFunctionArgs);
  }

  // Create the messages array
  const messages: MessageType[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPromptFunction(userFunctionArgs) }, // Call the prompt func
  ];

  if (DEBUG) {
    console.log("DEBUG: messages", messages);
  }

  // Call the OpenAI API
  const result = await getCompletion(messages);

  return result.toDataStreamResponse({
    headers: {
      "Access-Control-Allow-Origin": "*",
      // Ensure other necessary CORS headers if needed
    },
  });
});
