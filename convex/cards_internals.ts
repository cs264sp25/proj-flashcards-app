/******************************************************************************
 * INTERNALS
 *
 * Internal operations not exposed to clients:
 * - Used by other operations like seeding and AI actions
 * - Bypasses auth/authorization for internal use
 ******************************************************************************/
import { v } from "convex/values";
import { PaginationResult, paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";
import {
  QueryCtx,
  MutationCtx,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { internal } from "./_generated/api";

import { PaginationOptsType, SortOrder, SortOrderType } from "./shared";
import {
  getAllCards as getAllCardsHelper,
  createCard as createCardHelper,
  removeAllCardsInDeck as removeAllCardsInDeckHelper,
  removeAllCardsForUser as removeAllCardsForUserHelper,
} from "./cards_helpers";
import { cardInSchema, CardInType, CardOutType } from "./cards_schema";
import { getEmbeddingHelper } from "./openai_embeddings";
import { adjustCardCount } from "./decks_helpers";

/**
 * Get all cards in the given deck, optionally sorted by the given order
 */
export const getAllCards = internalQuery({
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
  ): Promise<PaginationResult<CardOutType>> => {
    return await getAllCardsHelper(
      ctx,
      args.paginationOpts,
      args.deckId,
      args.sortOrder,
    );
  },
});

/**
 * Get multiple cards by their IDs.
 */
export const getCards = internalQuery({
  args: {
    ids: v.array(v.id("cards")),
  },
  handler: async (ctx, args): Promise<CardOutType[]> => {
    const results: CardOutType[] = [];
    for (const id of args.ids) {
      const card = await ctx.db.get(id);
      if (card === null) continue;
      results.push({
        _id: card._id,
        _creationTime: card._creationTime,
        deckId: card.deckId,
        userId: card.userId,
        front: card.front,
        back: card.back,
      });
    }
    return results;
  },
});

/**
 * Create a new card. An internal mutation wrapper around the createCard helper
 * function, with additional card count adjustment. Used when we want to create
 * a card in a different context (ctx) like in seeding Actions.
 */
export const createCard = internalMutation({
  args: {
    card: v.object(cardInSchema),
    deckId: v.id("decks"),
    userId: v.id("users"),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      card: CardInType;
      deckId: Id<"decks">;
      userId: Id<"users">;
    },
  ): Promise<Id<"cards">> => {
    const cardId = await createCardHelper(
      ctx,
      args.card,
      args.deckId,
      args.userId,
    );
    await adjustCardCount(ctx, args.deckId, 1);
    return cardId;
  },
});

/**
 * Update a card with an embedding.
 */
export const updateCardWithEmbedding = internalMutation({
  args: {
    cardId: v.id("cards"),
    embedding: v.array(v.float64()),
  },
  handler: async (
    ctx: MutationCtx,
    args: { cardId: Id<"cards">; embedding: number[] },
  ): Promise<void> => {
    await ctx.db.patch(args.cardId, { embedding: args.embedding });
  },
});

/**
 * Delete all cards in a deck. An internal mutation wrapper around the
 * removeAllCardsInDeck helper function, with additional card count adjustment.
 * Used when we want to create a card in a different context (ctx) like in
 * seeding Actions.
 */
export const deleteCardsInDeck = internalMutation({
  args: { deckId: v.id("decks") },
  handler: async (
    ctx: MutationCtx,
    args: {
      deckId: Id<"decks">;
    },
  ): Promise<number> => {
    const numCardsDeleted = await removeAllCardsInDeckHelper(ctx, args.deckId);
    await adjustCardCount(ctx, args.deckId, -numCardsDeleted);
    return numCardsDeleted;
  },
});

/**
 * Delete all cards for a user. An internal mutation wrapper around the
 * removeAllCardsForUser helper function.
 * Used when we want to delete all cards for a user in a different context (ctx)
 * like in seeding Actions.
 */
export const deleteCardsForUser = internalMutation({
  args: { userId: v.id("users") },
  handler: async (
    ctx: MutationCtx,
    args: { userId: Id<"users"> },
  ): Promise<number> => {
    const numCardsDeleted = await removeAllCardsForUserHelper(ctx, args.userId);
    return numCardsDeleted;
  },
});

/**
 * Semantic search for cards.
 */
export const semanticSearch = internalAction({
  args: {
    query: v.string(),
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<CardOutType[]> => {
    const LIMIT = args.limit || 10;

    const { embedding } = await getEmbeddingHelper(args.query);

    const results = await ctx.vectorSearch("cards", "by_embedding", {
      vector: embedding,
      limit: LIMIT,
      filter: (q) => {
        return q.eq("userId", args.userId);
      },
    });

    const cards = await ctx.runQuery(internal.cards_internals.getCards, {
      ids: results.map((result) => result._id),
    });

    return cards.map((card, i) => ({
      ...card,
      _similarityScore: results[i]._score,
    }));
  },
});
