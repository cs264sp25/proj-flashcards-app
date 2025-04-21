/******************************************************************************
 * QUERIES
 *
 * Responsibility chain:
 * 1. Authentication check (using auth guard)
 * 2. Authorization check (using deck guard)
 * 3. Data operation (using helpers)
 *
 * Available queries:
 * - getAll: List user's decks
 * - getOne: Get single deck
 ******************************************************************************/
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, query } from "./_generated/server";

import { PaginationOptsType, SortOrder, SortOrderType } from "./shared";
import { authenticationGuard } from "./users_guards";
import { getAllDecks, getDeckById } from "./decks_helpers";
import { ownershipGuard } from "./decks_guards";
import { DeckOutType } from "./decks_schema";

/**
 * Get all decks for the authenticated user, optionally sorted by the given order
 */
export const getAll = query({
  args: {
    paginationOpts: paginationOptsValidator,
    sortOrder: v.optional(SortOrder),
    searchQuery: v.optional(v.string()),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      sortOrder?: SortOrderType;
      searchQuery?: string;
    },
  ): Promise<PaginationResult<DeckOutType>> => {
    const userId = await authenticationGuard(ctx);
    const results = await getAllDecks(
      ctx,
      args.paginationOpts,
      userId,
      args.sortOrder,
      args.searchQuery,
    );

    return {
      ...results,
      page: results.page.map((deck) => ({
        _id: deck._id,
        _creationTime: deck._creationTime,
        title: deck.title,
        description: deck.description,
        tags: deck.tags,
        cardCount: deck.cardCount,
        userId: deck.userId,
        // We don't need to send the searchableContent or embedding to the client
      })),
    };
  },
});

/**
 * Get a single deck by ID.
 * The authenticated user must own the deck, or an error is thrown.
 */
export const getOne = query({
  args: {
    deckId: v.id("decks"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      deckId: Id<"decks">;
    },
  ): Promise<DeckOutType> => {
    const userId = await authenticationGuard(ctx);
    const deck = await getDeckById(ctx, args.deckId);
    ownershipGuard(userId, deck.userId);
    return {
      _id: deck._id,
      _creationTime: deck._creationTime,
      title: deck.title,
      description: deck.description,
      tags: deck.tags,
      cardCount: deck.cardCount,
      userId: deck.userId,
      // We don't need to send the searchableContent or embedding to the client
    };
  },
});
