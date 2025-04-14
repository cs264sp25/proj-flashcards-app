/******************************************************************************
 * QUERIES
 *
 * Responsibility chain:
 * 1. Authentication check (using auth guard)
 * 2. Authorization check (using card guard)
 * 3. Data operation (using helpers)
 *
 * Available queries:
 * - getAll: List cards in deck
 * - getOne: Get single card
 ******************************************************************************/
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, query } from "./_generated/server";

import { PaginationOptsType, SortOrder, SortOrderType } from "./shared";
import { authenticationGuard } from "./users_guards";
import { getAllCards, getCardById } from "./cards_helpers";
import { ownershipGuard, ownershipGuardThroughDeck } from "./cards_guards";
import { CardOutType } from "./cards_schema";

/**
 * Get all cards for in the given deck, optionally sorted by the given order.
 * The authenticated user must own the deck, or an error is thrown.
 */
export const getAll = query({
  args: {
    paginationOpts: paginationOptsValidator,
    deckId: v.id("decks"),
    sortOrder: v.optional(SortOrder),
    searchQuery: v.optional(v.string()),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      deckId: Id<"decks">;
      sortOrder?: SortOrderType;
      searchQuery?: string;
    },
  ): Promise<PaginationResult<CardOutType>> => {
    const { deckId, sortOrder, searchQuery } = args;
    const userId = await authenticationGuard(ctx);
    await ownershipGuardThroughDeck(ctx, userId, deckId);
    const results = await getAllCards(
      ctx,
      args.paginationOpts,
      deckId,
      sortOrder,
      searchQuery,
    );

    return {
      ...results,
      page: results.page.map((card) => ({
        _id: card._id,
        _creationTime: card._creationTime,
        deckId: card.deckId,
        userId: card.userId,
        front: card.front,
        back: card.back,
        // We don't need to send the searchableContent or embedding to the client
      })),
    };
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
  ): Promise<CardOutType> => {
    const userId = await authenticationGuard(ctx);
    const card = await getCardById(ctx, args.cardId);
    await ownershipGuard(userId, card.userId);
    return {
      _id: card._id,
      _creationTime: card._creationTime,
      deckId: card.deckId,
      userId: card.userId,
      front: card.front,
      back: card.back,
      // We don't need to send the searchableContent or embedding to the client
    };
  },
});
