/******************************************************************************
 * SEED
 *
 * Testing and development data generation:
 * - Uses internal actions/mutations to bypass auth
 ******************************************************************************/
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

import { 
  EvaluationStatus, 
  CardEvaluation 
} from "./studies_schema";

// Configuration for seeding
const DEFAULT_NUM_DECKS_TO_SEED = 5;
const DEFAULT_CLEAR_EXISTING_DATA = false;
const DEBUG_SEEDING = true; // Set to false to disable console logs

/**
 * Generates random card evaluations for a study session.
 */
function generateRandomEvaluations(
  cards: Array<{ _id: Id<"cards"> }>,
  numberOfCardsToEvaluate: number,
  startTime: number,
): CardEvaluation[] {
  const statuses: EvaluationStatus[] = [
    "correct",
    "incorrect",
    "partial",
    "skipped",
  ];
  const evaluations: CardEvaluation[] = [];
  let currentTime = startTime;

  // Ensure we don't try to evaluate more cards than available
  numberOfCardsToEvaluate = Math.min(numberOfCardsToEvaluate, cards.length);

  // Randomly select a subset of cards if needed
  const selectedCards = [...cards]
    .sort(() => Math.random() - 0.5) // Basic shuffle
    .slice(0, numberOfCardsToEvaluate);

  for (const card of selectedCards) {
    // Random time between 5 and 30 seconds for each card evaluation
    const timeSpent = Math.floor(Math.random() * 25000) + 5000; // 5 to 30 seconds in ms
    currentTime += timeSpent;

    evaluations.push({
      cardId: card._id,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      evaluatedAt: currentTime,
    });
  }

  return evaluations;
}

/**
 * Create sample study sessions for a user based on their existing decks.
 * Pre: The user must have some decks with cards.
 * `numberOfDecks`: The number of decks to create studies for (defaults to 5).
 * `clearExistingData`: If true, deletes all existing studies for the user first.
 */
export const createSampleStudies = internalAction({
  args: {
    userId: v.id("users"),
    numberOfDecks: v.optional(v.number()),
    clearExistingData: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<Id<"studies">[]> => {
    const userId = args.userId;
    const numberOfDecks = args.numberOfDecks || DEFAULT_NUM_DECKS_TO_SEED;
    const clearExistingData = args.clearExistingData ?? DEFAULT_CLEAR_EXISTING_DATA;

    if (DEBUG_SEEDING) {
      console.log(`Seeding studies for user ${userId}...`);
      console.log(` - Target decks: ${numberOfDecks}`);
      console.log(` - Clear existing studies: ${clearExistingData}`);
    }

    const studyIds: Id<"studies">[] = [];

    if (clearExistingData) {
      if (DEBUG_SEEDING) console.log("Clearing existing studies...");
      // Use the internal mutation for deleting studies
      const deletedCount = await ctx.runMutation(internal.studies_internals.deleteStudies, {
        userId: args.userId,
      });
      if (DEBUG_SEEDING) console.log(`Cleared ${deletedCount} studies.`);
    }

    // Fetch decks for the user using the internal query
    if (DEBUG_SEEDING) console.log("Fetching decks...");
    const { page: decks } = await ctx.runQuery(
      internal.decks_internals.getAllDecks, // Use internal query for decks
      {
        paginationOpts: { numItems: numberOfDecks, cursor: null },
        sortOrder: "asc", // Or any order
        userId,
      },
    );

    if (DEBUG_SEEDING) {
      console.log(`Found ${decks.length} decks for seeding studies.`);
    }

    if (!decks || decks.length === 0) {
      console.warn(`No decks found for user ${userId}. Cannot seed studies.`);
      return [];
    }

    for (const deck of decks) {
      if (DEBUG_SEEDING) console.log(`Processing deck: ${deck.title} (${deck._id})`);

      if (deck.cardCount === 0) {
        if (DEBUG_SEEDING) console.log(`  Skipping deck ${deck._id}: No cards.`);
        continue;
      }

      // Fetch cards for the current deck using the internal query
      if (DEBUG_SEEDING) console.log(`  Fetching cards for deck ${deck._id}...`);
      const { page: cards } = await ctx.runQuery(
        internal.cards_internals.getAllCards, // Use internal query for cards
        {
          paginationOpts: { numItems: deck.cardCount, cursor: null },
          sortOrder: "asc", // Or any order
          deckId: deck._id,
        },
      );

      if (DEBUG_SEEDING) {
        console.log(`  Found ${cards.length} cards for deck ${deck._id}.`);
      }

      if (!cards || cards.length === 0) {
        // This case should ideally not happen if cardCount > 0, but good to check
        if (DEBUG_SEEDING) console.log(`  Skipping deck ${deck._id}: Found 0 cards despite count ${deck.cardCount}.`);
        continue;
      }

      // Create a new study using the internal mutation
      if (DEBUG_SEEDING) console.log(`  Creating study for deck ${deck._id}...`);
      const studyId = await ctx.runMutation(
        internal.studies_internals.createStudy,
        {
          userId,
          study: { deckId: deck._id }, // Pass necessary info for creation
        },
      );
      if (DEBUG_SEEDING) console.log(`  Created study ${studyId}.`);

      // Generate and record evaluations using internal mutation
      const startTime = Date.now() - Math.floor(Math.random() * 86400000 * 7); // Random start time within last week
      // Evaluate a random number of cards (at least 1, up to all cards)
      const cardsToEvaluate = Math.max(1, Math.floor(Math.random() * (cards.length + 1)));
      if (DEBUG_SEEDING) console.log(`  Generating ${cardsToEvaluate} evaluations...`);

      const evaluations = generateRandomEvaluations(
        cards,
        cardsToEvaluate,
        startTime,
      );

      if (DEBUG_SEEDING) console.log(`  Recording ${evaluations.length} evaluations for study ${studyId}...`);
      for (const evaluation of evaluations) {
        await ctx.runMutation(internal.studies_internals.recordCardEvaluation, {
          // userId, // Not needed for recordCardEvaluation internal mutation
          studyId,
          evaluation,
        });
      }
      if (DEBUG_SEEDING) console.log(`  Finished recording evaluations.`);

      // Randomly complete some studies using internal mutation
      if (Math.random() > 0.5) {
        if (DEBUG_SEEDING) console.log(`  Completing study ${studyId}...`);
        await ctx.runMutation(internal.studies_internals.completeStudy, {
          // userId, // Not needed for completeStudy internal mutation
          studyId,
        });
      }

      studyIds.push(studyId as Id<"studies">);
    }

    if (DEBUG_SEEDING) console.log("Finished seeding studies.");
    return studyIds;
  },
});
