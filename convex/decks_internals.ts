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
  getAllDecks as getAllDecksHelper,
  createDeck as createDeckHelper,
  deleteAllDecksWithCascade as deleteAllDecksWithCascadeHelper,
} from "./decks_helpers";
import { deckInSchema, DeckInType, DeckOutType } from "./decks_schema";
import { getEmbedding } from "./openai_helpers";

/**
 * Get all decks for the given user, optionally sorted by the given order
 */
export const getAllDecks = internalQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    sortOrder: v.optional(SortOrder),
    userId: v.id("users"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      sortOrder?: SortOrderType;
      userId: Id<"users">;
    },
  ): Promise<PaginationResult<DeckOutType>> => {
    return await getAllDecksHelper(
      ctx,
      args.paginationOpts,
      args.userId,
      args.sortOrder,
    );
  },
});

/**
 * Get multiple decks by their IDs.
 */
export const getDecks = internalQuery({
  args: {
    ids: v.array(v.id("decks")),
  },
  handler: async (ctx, args): Promise<DeckOutType[]> => {
    const results: DeckOutType[] = [];
    for (const id of args.ids) {
      const deck = await ctx.db.get(id);
      if (deck === null) continue;
      results.push({
        _id: deck._id,
        _creationTime: deck._creationTime,
        title: deck.title,
        description: deck.description,
        tags: deck.tags,
        cardCount: deck.cardCount,
        userId: deck.userId,
      });
    }
    return results;
  },
});

/**
 * Create a new deck for the given user.
 * An internal mutation wrapper around the createDeck helper.
 * Used when we want to create a deck in a different context (ctx) like in seeding Actions.
 */
export const createDeck = internalMutation({
  args: {
    userId: v.id("users"),
    deck: v.object(deckInSchema),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      userId: Id<"users">;
      deck: DeckInType;
    },
  ): Promise<Id<"decks">> => {
    return await createDeckHelper(ctx, args.userId, args.deck);
  },
});

/**
 * Update a deck with an embedding.
 */
export const updateDeckWithEmbedding = internalMutation({
  args: {
    deckId: v.id("decks"),
    embedding: v.array(v.float64()),
  },
  handler: async (
    ctx: MutationCtx,
    args: { deckId: Id<"decks">; embedding: number[] },
  ): Promise<void> => {
    await ctx.db.patch(args.deckId, { embedding: args.embedding });
  },
});

/**
 * Delete all decks (and their cards) for the given user.
 * An internal mutation wrapper around the deleteAllDecksWithCascade helper.
 * Used when we want to delete decks in a different context (ctx) like in seeding Actions.
 */
export const deleteDecksWithCascade = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      userId: Id<"users">;
    },
  ): Promise<number> => {
    return await deleteAllDecksWithCascadeHelper(ctx, args.userId);
  },
});

/**
 * Semantic search for decks.
 */
export const semanticSearch = internalAction({
  args: {
    query: v.string(),
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<DeckOutType[]> => {
    const LIMIT = args.limit || 10;

    const embedding = await getEmbedding(args.query);

    const results = await ctx.vectorSearch("decks", "by_embedding", {
      vector: embedding,
      limit: LIMIT,
      filter: (q) => {
        return q.eq("userId", args.userId);
      },
    });

    const decks = await ctx.runQuery(internal.decks_internals.getDecks, {
      ids: results.map((result) => result._id),
    });

    return decks.map((deck, i) => ({
      ...deck,
      _similarityScore: results[i]._score,
    }));
  },
});
