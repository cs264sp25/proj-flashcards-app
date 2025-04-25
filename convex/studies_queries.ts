/******************************************************************************
 * QUERIES
 *
 * Responsibility chain:
 * 1. Authentication check (using auth guard)
 * 2. Authorization check (using study/deck guards)
 * 3. Data operation (using helpers)
 *
 * Available queries:
 * - getAll: List user's study sessions
 * - getOne: Get single study session
 * - getStudyCards: Get cards associated with a study's deck
 ******************************************************************************/
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { query, QueryCtx } from "./_generated/server";

import { SortOrder, SortOrderType, PaginationOptsType } from "./shared";
import { authenticationGuard } from "./users_guards";
import { getDeckById } from "./decks_helpers";
import { ownershipGuard as deckOwnershipGuard } from "./decks_guards";
import { getAllCards } from "./cards_helpers";

import { ownershipGuard } from "./studies_guards";
import {
  getAllStudies as getAllStudiesHelper,
  getStudyById as getStudyByIdHelper,
} from "./studies_helpers";
import { CardOutType } from "./cards_schema";

/**
 * Get all study sessions for the authenticated user, optionally sorted.
 */
export const getAll = query({
  args: {
    paginationOpts: paginationOptsValidator,
    sortOrder: v.optional(SortOrder),
    deckId: v.optional(v.id("decks")),
    afterThisCreationTime: v.optional(v.number()),
    beforeThisCreationTime: v.optional(v.number()),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      sortOrder?: SortOrderType;
      deckId?: Id<"decks">;
      afterThisCreationTime?: number;
      beforeThisCreationTime?: number;
    },
  ): Promise<PaginationResult<Doc<"studies">>> => {
    const userId = await authenticationGuard(ctx);
    // Call the helper to fetch studies for the authenticated user
    return await getAllStudiesHelper(
      ctx,
      args.paginationOpts,
      userId,
      args.deckId,
      args.sortOrder,
      args.afterThisCreationTime,
      args.beforeThisCreationTime,
    );
  },
});

/**
 * Get a single study session by ID.
 * The authenticated user must own the study.
 */
export const getOne = query({
  args: {
    studyId: v.id("studies"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      studyId: Id<"studies">;
    },
  ): Promise<Doc<"studies">> => {
    const userId = await authenticationGuard(ctx);
    const study = await getStudyByIdHelper(ctx, args.studyId); // Use helper
    ownershipGuard(userId, study.userId); // Check ownership
    return study;
  },
});

/**
 * Get all cards for a study.
 * Currently, this is a simple passthrough to get all cards for a deck.
 * We may want to make this more complex in the future.
 */
export const getStudyCards = query({
  args: {
    deckId: v.id("decks"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      deckId: Id<"decks">;
    },
  ): Promise<CardOutType[]> => {
    const { deckId } = args;
    const userId = await authenticationGuard(ctx);
    const deck = await getDeckById(ctx, args.deckId);
    deckOwnershipGuard(userId, deck.userId);

    const results = await getAllCards(
      ctx,
      { cursor: null, numItems: deck.cardCount },
      deckId,
      "asc",
    );

    return results.page.map((card) => ({
      _id: card._id,
      _creationTime: card._creationTime,
      deckId: card.deckId,
      userId: card.userId,
      front: card.front,
      back: card.back,
      // We don't need to send the searchableContent or embedding to the client
    }));
  },
});
