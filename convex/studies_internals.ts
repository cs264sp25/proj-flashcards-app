/******************************************************************************
 * INTERNALS
 *
 * Internal operations not exposed to clients:
 * - Used by other operations like seeding and AI actions
 * - Bypasses auth/authorization for internal use
 ******************************************************************************/
import { v } from "convex/values";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { Id, Doc } from "./_generated/dataModel";
import {
  QueryCtx,
  MutationCtx,
  internalQuery,
  internalMutation,
} from "./_generated/server";

import { PaginationOptsType, SortOrder, SortOrderType } from "./shared";
import {
  studyInSchema,
  cardEvaluationSchema,
  StudyInType,
  CardEvaluation,
} from "./studies_schema";
import {
  getAllStudies as getAllStudiesHelper,
  getStudyById as getStudyByIdHelper,
  createStudy as createStudyHelper,
  recordEvaluation as recordEvaluationHelper,
  completeStudySession as completeStudySessionHelper,
  deleteAllStudies as deleteAllStudiesHelper,
} from "./studies_helpers";

/**
 * Get all studies for a given user, optionally sorted.
 * Internal query wrapper around the getAllStudies helper.
 */
export const getAllStudies = internalQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    sortOrder: v.optional(SortOrder),
    userId: v.optional(v.id("users")),
    deckId: v.optional(v.id("decks")),
    afterThisCreationTime: v.optional(v.number()),
    beforeThisCreationTime: v.optional(v.number()),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      sortOrder?: SortOrderType;
      userId?: Id<"users">;
      deckId?: Id<"decks">;
      afterThisCreationTime?: number;
      beforeThisCreationTime?: number;
    },
  ): Promise<PaginationResult<Doc<"studies">>> => {
    return await getAllStudiesHelper(
      ctx,
      args.paginationOpts,
      args.userId,
      args.deckId,
      args.sortOrder,
      args.afterThisCreationTime,
      args.beforeThisCreationTime,
    );
  },
});

/**
 * Get a study by its ID.
 * Internal query wrapper around the getStudyById helper.
 */
export const getStudyById = internalQuery({
  args: {
    studyId: v.id("studies"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      studyId: Id<"studies">;
    },
  ): Promise<Doc<"studies">> => {
    return await getStudyByIdHelper(ctx, args.studyId);
  },
});

/**
 * Create a new study for the given user.
 * Internal mutation wrapper around the createStudy helper.
 */
export const createStudy = internalMutation({
  args: {
    userId: v.id("users"),
    study: v.object(studyInSchema),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      userId: Id<"users">;
      study: StudyInType;
    },
  ): Promise<Id<"studies">> => {
    return await createStudyHelper(ctx, args.userId, args.study);
  },
});

/**
 * Record a card evaluation in a study session.
 * Internal mutation wrapper around the recordEvaluation helper.
 */
export const recordCardEvaluation = internalMutation({
  args: {
    studyId: v.id("studies"),
    evaluation: cardEvaluationSchema,
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      studyId: Id<"studies">;
      evaluation: CardEvaluation;
    },
  ): Promise<void> => {
    await recordEvaluationHelper(ctx, args.studyId, args.evaluation);
  },
});

/**
 * Complete a study session.
 * Internal mutation wrapper around the completeStudySession helper.
 */
export const completeStudy = internalMutation({
  args: {
    studyId: v.id("studies"),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      studyId: Id<"studies">;
    },
  ): Promise<void> => {
    await completeStudySessionHelper(ctx, args.studyId, Date.now());
  },
});

/**
 * Delete all studies for the given user.
 * Internal mutation wrapper around the deleteAllStudies helper.
 */
export const deleteStudies = internalMutation({
  args: {
    userId: v.optional(v.id("users")),
    deckId: v.optional(v.id("decks")),
    afterThisCreationTime: v.optional(v.number()),
    beforeThisCreationTime: v.optional(v.number()),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      userId?: Id<"users">;
      deckId?: Id<"decks">;
      afterThisCreationTime?: number;
      beforeThisCreationTime?: number;
    },
  ): Promise<number> => {
    return await deleteAllStudiesHelper(
      ctx,
      args.userId,
      args.deckId,
      args.afterThisCreationTime,
      args.beforeThisCreationTime,
    );
  },
});
