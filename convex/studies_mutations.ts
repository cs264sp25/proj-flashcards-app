/******************************************************************************
 * MUTATIONS
 *
 * Responsibility chain:
 * 1. Data validation (convex validates args)
 * 2. Authentication check (using auth guard)
 * 3. Authorization check (using study/deck guards)
 * 4. Data operation (using helpers)
 * 5. Related operations (like cascade deletes - N/A here currently)
 *
 * Available mutations:
 * - create: Create new study session for a deck
 * - record: Record a card evaluation during a study session
 * - complete: Mark a study session as completed
 * - remove: Delete a study session record
 ******************************************************************************/
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { MutationCtx, mutation } from "./_generated/server";

import { authenticationGuard } from "./users_guards";
import { ownershipGuard as deckOwnershipGuard } from "./decks_guards";
import { getDeckById } from "./decks_helpers";

import {
  completeStudySession as completeStudySessionHelper,
  deleteStudy as deleteStudyHelper,
  getStudyById as getStudyByIdHelper,
  createStudy as createStudyHelper,
  recordEvaluation as recordEvaluationHelper,
} from "./studies_helpers";
import { cardEvaluationSchema, CardEvaluation } from "./studies_schema";
import { ownershipGuard } from "./studies_guards";

/**
 * Create a new study session for a deck.
 */
export const create = mutation({
  args: {
    deckId: v.id("decks"),
  },
  handler: async (
    ctx: MutationCtx,
    args: { deckId: Id<"decks"> },
  ): Promise<Id<"studies">> => {
    const userId = await authenticationGuard(ctx);
    const deck = await getDeckById(ctx, args.deckId);
    deckOwnershipGuard(userId, deck.userId);

    // Use the helper to create the study
    return await createStudyHelper(ctx, userId, { deckId: args.deckId });
  },
});

/**
 * Record a card evaluation in a study session.
 */
export const record = mutation({
  args: {
    studyId: v.id("studies"),
    evaluation: cardEvaluationSchema,
  },
  handler: async (
    ctx: MutationCtx,
    args: { studyId: Id<"studies">; evaluation: CardEvaluation },
  ): Promise<void> => {
    const userId = await authenticationGuard(ctx);
    const study = await getStudyByIdHelper(ctx, args.studyId);
    ownershipGuard(userId, study.userId);

    // Use the helper to record the evaluation
    await recordEvaluationHelper(ctx, args.studyId, args.evaluation);
  },
});

/**
 * Complete a study session.
 */
export const complete = mutation({
  args: {
    studyId: v.id("studies"),
  },
  handler: async (
    ctx: MutationCtx,
    args: { studyId: Id<"studies"> },
  ): Promise<void> => {
    const userId = await authenticationGuard(ctx);
    const study = await getStudyByIdHelper(ctx, args.studyId);
    ownershipGuard(userId, study.userId);

    // Call the helper to mark the study as complete
    await completeStudySessionHelper(ctx, args.studyId, Date.now());
  },
});

/**
 * Delete a study record given its ID.
 * The authenticated user must own the study.
 */
export const remove = mutation({
  args: {
    studyId: v.id("studies"),
  },
  handler: async (
    ctx: MutationCtx,
    args: { studyId: Id<"studies"> },
  ): Promise<boolean> => {
    const userId = await authenticationGuard(ctx);
    const study = await getStudyByIdHelper(ctx, args.studyId);
    ownershipGuard(userId, study.userId);

    await deleteStudyHelper(ctx, args.studyId);
    return true;
  },
});
