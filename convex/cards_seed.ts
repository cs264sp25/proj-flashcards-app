/******************************************************************************
 * SEED
 *
 * Testing and development data generation:
 * - Uses internal mutations to bypass auth
 ******************************************************************************/
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// The default number of cards to create.
const NUM_CARDS = 5;
const CLEAR_EXISTING_DATA = false;

/**
 * Create sample cards for a given deck.
 * numberOfCards is optional and defaults to NUM_CARDS.
 * If clearExistingData is true, deletes all existing cards in the deck.
 */
export const createSampleCards = internalAction({
  args: {
    deckId: v.id("decks"),
    userId: v.id("users"),
    numberOfCards: v.optional(v.number()),
    clearExistingData: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    args: {
      deckId: Id<"decks">;
      userId: Id<"users">;
      numberOfCards?: number;
      clearExistingData?: boolean;
    },
  ): Promise<Id<"cards">[]> => {
    const userId = args.userId;
    const deckId = args.deckId;
    const numberOfCards = args.numberOfCards || NUM_CARDS;
    const clearExistingData = args.clearExistingData || CLEAR_EXISTING_DATA;
    const cardIds: Id<"cards">[] = [];

    if (clearExistingData) {
      await ctx.runMutation(internal.cards_internals.deleteCardsInDeck, {
        deckId,
      });
    }

    for (let i = 0; i < numberOfCards; i++) {
      const cardId = await ctx.runMutation(
        internal.cards_internals.createCard,
        {
          card: {
            front: `Front of card ${i + 1}`,
            back: `Back of card ${i + 1}`,
          },
          deckId,
          userId,
        },
      );

      cardIds.push(cardId as Id<"cards">);
    }

    return cardIds;
  },
});
