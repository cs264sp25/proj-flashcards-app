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
    return await getAllCards(
      ctx,
      args.paginationOpts,
      deckId,
      sortOrder,
      searchQuery,
    );
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
    return card;
  },
});
