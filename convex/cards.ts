/******************************************************************************
 * CARDS MODULE
 *
 * This module handles card management, following the same patterns as the decks
 * module.
 *
 * Key Design Patterns:
 *
 * 1. Deck Integration:
 *    Card Operation
 *    └─► Check Auth
 *        └─► Verify Deck Ownership
 *            └─► Perform Card Operation
 *                └─► Update Deck Card Count
 *
 * 2. Data Integrity:
 *    - Card operations maintain deck card count
 *    - Cards are always associated with a deck
 *    - Bulk operations handle counts correctly
 *
 * 3. Access Control:
 *    - Authentication always checked first
 *    - Authorization follows authentication
 *    - Ownership verified before any operation
 ******************************************************************************/
import {
  defineTable,
  PaginationResult,
  IndexRangeBuilder,
  paginationOptsValidator,
} from "convex/server";
import { ConvexError, Infer, v } from "convex/values";
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
  internalAction,
  QueryCtx,
  MutationCtx,
  ActionCtx,
} from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

import {
  SortOrder,
  type PaginationOptsType,
  type SortOrderType,
} from "./shared";
import { authenticationGuard } from "./users";
import { adjustCardCount, getDeckById } from "./decks";
import { ownershipGuard as deckOwnershipCheck } from "./decks";

/******************************************************************************
 * SCHEMA
 *
 * Defines types and database schema for cards:
 * - CardInType: Fields for creating/updating cards
 * - CardType: Complete card document type
 * - Follows same pattern as deck schema
 * - Includes database indexes for efficient querying (by_deck_id)
 ******************************************************************************/

/**
 * Type representing the fields that can be provided when creating a card
 */
export const cardInSchema = {
  deckId: v.id("decks"),
  front: v.string(),
  back: v.string(),
};

// eslint-disable-next-line
const cardInSchemaObject = v.object(cardInSchema);
export type CardInType = Infer<typeof cardInSchemaObject>;

/**
 * Type representing the fields that can be provided when updating a card
 */
export const cardUpdateSchema = {
  deckId: v.optional(v.id("decks")),
  front: v.optional(v.string()),
  back: v.optional(v.string()),
};

// eslint-disable-next-line
const cardUpdateSchemaObject = v.object(cardUpdateSchema);
export type CardUpdateType = Infer<typeof cardUpdateSchemaObject>;

/**
 * Type representing a card in the database
 */
export const cardSchema = {
  ...cardInSchema,
  // Convex will automatically add `_id` and `_creationTime` fields to the schema
};

// eslint-disable-next-line
const cardSchemaObject = v.object(cardSchema);
export type CardType = Infer<typeof cardSchemaObject>;

/**
 * Card table schema definition
 */
export const cardTables = {
  cards: defineTable(cardSchema).index("by_deck_id", ["deckId"]),
};

/******************************************************************************
 * HELPERS
 *
 * Pure database operations without auth/authorization:
 * - Core CRUD operations:
 *   - getAllCards: Retrieval with optional deck filter
 *   - getCardById: Single card retrieval
 *   - createCard: Basic card creation
 *   - updateCard: Basic card update
 *   - deleteCard: Basic card deletion
 * - Special operations:
 *   - removeAllCardsInDeck: Bulk deletion for deck cleanup
 ******************************************************************************/

export async function getAllCards(
  ctx: QueryCtx,
  paginationOpts: PaginationOptsType,
  deckId?: Id<"decks">,
  sortOrder?: SortOrderType,
) {
  sortOrder = sortOrder || "asc";

  const results: PaginationResult<Doc<"cards">> = await ctx.db
    .query("cards")
    .withIndex(
      "by_deck_id",
      (q: IndexRangeBuilder<Doc<"cards">, ["deckId", "_creationTime"], 0>) => {
        let q1;

        if (deckId) {
          q1 = q.eq("deckId", deckId);
        }

        return q1 || q;
      },
    )
    .order(sortOrder)
    .paginate(paginationOpts);

  return {
    ...results,
    page: results.page, // This is the data (records) for the current page; we can transform it if needed
  };
}

export async function getCardById(ctx: QueryCtx, cardId: Id<"cards">) {
  const card = await ctx.db.get(cardId);
  if (!card) {
    throw new ConvexError({
      message: `Card ${cardId} not found`,
      code: 404,
    });
  }
  return card;
}

// Does not update the card count of the deck.
export async function createCard(ctx: MutationCtx, data: CardInType) {
  return await ctx.db.insert("cards", { ...data });
}

// Does not update the card count of the deck if the deckId is changed.
export async function updateCard(
  ctx: MutationCtx,
  cardId: Id<"cards">,
  data: CardUpdateType,
) {
  await ctx.db.patch(cardId, data);
}

// Does not update the card count of the deck.
export async function deleteCard(ctx: MutationCtx, cardId: Id<"cards">) {
  await ctx.db.delete(cardId);
}

// Returns the number of cards deleted.
// Does not update the card count of the deck.
export async function removeAllCardsInDeck(
  ctx: MutationCtx,
  deckId: Id<"decks">,
) {
  const cards = await ctx.db
    .query("cards")
    .withIndex("by_deck_id", (q) => q.eq("deckId", deckId))
    .collect();

  await Promise.all(cards.map((card) => deleteCard(ctx, card._id)));

  return cards.length;
}

/******************************************************************************
 * QUERIES
 *
 * Responsibility chain:
 * 1. Authentication check (auth guard)
 * 2. Authorization check (deck ownership)
 * 3. Data operation (helpers)
 *
 * Available queries:
 * - getAll: List cards in deck
 * - getOne: Get single card
 ******************************************************************************/

/**
 * Get all cards for in the given deck, optionally sorted by the given order.
 * The authenticated user must own the deck, or an error is thrown.
 */
export const getAll = query({
  args: {
    paginationOpts: paginationOptsValidator,
    deckId: v.id("decks"),
    sortOrder: v.optional(SortOrder),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      deckId: Id<"decks">;
      sortOrder?: SortOrderType;
    },
  ) => {
    const { deckId, sortOrder } = args;
    const userId = await authenticationGuard(ctx);
    const deck = await getDeckById(ctx, args.deckId);
    deckOwnershipCheck(userId, deck.userId);
    return await getAllCards(ctx, args.paginationOpts, deckId, sortOrder);
  },
});

/**
 * Get a single card by ID. The authenticated user must own the deck that
 * contains the card, or an error is thrown.
 */
export const getOne = query({
  args: {
    cardId: v.id("cards"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      cardId: Id<"cards">;
    },
  ) => {
    const userId = await authenticationGuard(ctx);
    const card = await getCardById(ctx, args.cardId);
    const deck = await getDeckById(ctx, card.deckId);
    deckOwnershipCheck(userId, deck.userId);
    return card;
  },
});

/******************************************************************************
 * MUTATIONS
 *
 * Responsibility chain:
 * 1. Data validation (convex validates args)
 * 2. Authentication check (auth guard)
 * 3. Authorization check (deck ownership)
 * 4. Data operation (helpers)
 * 5. Related operations (deck card count)
 *
 * Available mutations:
 * - create: Create new card
 * - update: Update existing card
 * - remove: Delete card
 ******************************************************************************/

/**
 * Create a new card. The authenticated user must own the deck, or an error is
 * thrown.
 */
export const create = mutation({
  args: { ...cardInSchema },
  handler: async (ctx: MutationCtx, args: CardInType) => {
    const userId = await authenticationGuard(ctx);
    const deck = await getDeckById(ctx, args.deckId);
    deckOwnershipCheck(userId, deck.userId);
    const cardId = await createCard(ctx, args);
    await adjustCardCount(ctx, args.deckId, 1);
    return cardId;
  },
});

/**
 * Update an existing card. The authenticated user must own the deck, that cards
 * belongs do and the one that is being updated, or an error is thrown.
 */
export const update = mutation({
  args: {
    cardId: v.id("cards"),
    ...cardUpdateSchema,
  },
  handler: async (
    ctx: MutationCtx,
    args: CardUpdateType & {
      cardId: Id<"cards">;
    },
  ) => {
    const { cardId, ...data } = args;
    const userId = await authenticationGuard(ctx);
    const card = await getCardById(ctx, cardId);
    const deck = await getDeckById(ctx, card.deckId);
    deckOwnershipCheck(userId, deck.userId);

    // Move card to a different deck?
    if (data.deckId && data.deckId !== card.deckId) {
      // Check if the new deck is owned by the user
      const newDeck = await getDeckById(ctx, data.deckId);
      deckOwnershipCheck(userId, newDeck.userId);

      // Adjust card counts
      await adjustCardCount(ctx, card.deckId, -1);
      await adjustCardCount(ctx, data.deckId, 1);
    }

    // Update the card
    await updateCard(ctx, cardId, data);
    return true;
  },
});

/**
 * Delete a card. The authenticated user must own the deck that contains this
 * card, or an error is thrown.
 */
export const remove = mutation({
  args: {
    cardId: v.id("cards"),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      cardId: Id<"cards">;
    },
  ) => {
    const userId = await authenticationGuard(ctx);
    const card = await getCardById(ctx, args.cardId);
    const deck = await getDeckById(ctx, card.deckId);
    deckOwnershipCheck(userId, deck.userId);
    await deleteCard(ctx, args.cardId);
    await adjustCardCount(ctx, card.deckId, -1);
    return true;
  },
});

/******************************************************************************
 * INTERNALS
 *
 * System operations bypassing auth:
 * - Handles card count updates
 * - Used by seeding utilities
 ******************************************************************************/

/**
 * Get all cards in the given deck, optionally sorted by the given order
 */
export const getAllInternal = internalQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    sortOrder: v.optional(SortOrder),
    deckId: v.id("decks"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      sortOrder?: SortOrderType;
      deckId: Id<"decks">;
    },
  ) => {
    return await getAllCards(
      ctx,
      args.paginationOpts,
      args.deckId,
      args.sortOrder,
    );
  },
});

/**
 * Create a new card. An internal mutation wrapper around the createCard helper
 * function, with additional card count adjustment. Used when we want to create
 * a card in a different context (ctx) like in seeding Actions.
 */
export const createCardInternal = internalMutation({
  args: {
    card: v.object(cardInSchema),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      card: CardInType;
    },
  ) => {
    const cardId = await createCard(ctx, args.card);
    await adjustCardCount(ctx, args.card.deckId, 1);
    return cardId;
  },
});

/**
 * Delete all cards in a deck. An internal mutation wrapper around the
 * removeAllCardsInDeck helper function, with additional card count adjustment.
 * Used when we want to create a card in a different context (ctx) like in
 * seeding Actions.
 */
export const deleteCardsInternal = internalMutation({
  args: { deckId: v.id("decks") },
  handler: async (
    ctx: MutationCtx,
    args: {
      deckId: Id<"decks">;
    },
  ) => {
    const numCardsDeleted = await removeAllCardsInDeck(ctx, args.deckId);
    await adjustCardCount(ctx, args.deckId, -numCardsDeleted);
    return numCardsDeleted;
  },
});

/******************************************************************************
 * SEED
 *
 * Testing and development data generation:
 * - Uses internal mutations to bypass auth
 ******************************************************************************/

/**
 * Create sample cards for a given deck.
 * numberOfCards is optional and defaults to 5.
 * If clearExistingData is true, deletes all existing cards in the deck.
 */
export const createSampleCards = internalAction({
  args: {
    deckId: v.id("decks"),
    numberOfCards: v.optional(v.number()),
    clearExistingData: v.optional(v.boolean()),
  },
  handler: async (
    ctx: ActionCtx,
    args: {
      deckId: Id<"decks">;
      numberOfCards?: number;
      clearExistingData?: boolean;
    },
  ) => {
    const deckId = args.deckId;
    const numberOfCards = args.numberOfCards || 5;
    const clearExistingData = args.clearExistingData || false;
    const cardIds: Id<"cards">[] = [];

    if (clearExistingData) {
      await ctx.runMutation(
        // @ts-ignore
        internal.cards.deleteCardsInternal,
        {
          deckId,
        },
      );
    }

    for (let i = 0; i < numberOfCards; i++) {
      const cardId = await ctx.runMutation(
        // @ts-ignore
        internal.cards.createCardInternal,
        {
          card: {
            deckId,
            front: `Front of card ${i + 1}`,
            back: `Back of card ${i + 1}`,
          },
        },
      );

      cardIds.push(cardId as Id<"cards">);
    }

    return cardIds;
  },
});
