/******************************************************************************
 * SEED
 *
 * Testing and development data generation:
 * - Uses internal mutations to bypass auth
 ******************************************************************************/
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { ActionCtx, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// The default number of decks to create.
const NUM_DECKS = 5;
const CLEAR_EXISTING_DATA = false;

/**
 * Create sample decks for a user.
 * numberOfDecks is optional and defaults to NUM_DECKS.
 * If clearExistingData is true, deletes all existing decks for the user.
 */
export const createSampleDecks = internalAction({
  args: {
    userId: v.id("users"),
    numberOfDecks: v.optional(v.number()),
    clearExistingData: v.optional(v.boolean()),
  },
  handler: async (
    ctx: ActionCtx,
    args: {
      userId: Id<"users">;
      numberOfDecks?: number;
      clearExistingData?: boolean;
    },
  ): Promise<Id<"decks">[]> => {
    const userId = args.userId;
    const numberOfDecks = args.numberOfDecks || NUM_DECKS;
    const clearExistingData = args.clearExistingData || CLEAR_EXISTING_DATA;
    const deckIds: Id<"decks">[] = [];

    if (clearExistingData) {
      await ctx.runMutation(internal.decks_internals.deleteDecksWithCascade, {
        userId: args.userId,
      });
    }

    for (let i = 0; i < numberOfDecks; i++) {
      const deckId = await ctx.runMutation(
        internal.decks_internals.createDeck,
        {
          userId,
          deck: { title: `Deck ${i + 1}` },
        },
      );

      deckIds.push(deckId as Id<"decks">);
    }

    return deckIds;
  },
});
