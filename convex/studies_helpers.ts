/******************************************************************************
 * HELPERS
 *
 * Pure database operations without auth/authorization checks:
 * - Core CRUD operations:
 *   - getAllStudies: Basic study retrieval with filters
 *   - getStudyById: Single study retrieval
 *   - createStudy: Basic study creation
 *   - updateStudy: Basic study update
 *   - deleteStudy: Basic study deletion
 * - Study session operations:
 *   - recordEvaluation: Records a card evaluation and updates stats
 *   - completeStudySession: Marks a study as completed
 *   - deleteAllStudies: Bulk delete studies (use with caution)
 * - Utility functions:
 *   - initializeStudyStats: Creates default study statistics object
 *   - updateStudyStats: Updates statistics based on an evaluation
 *   - getTimeSinceLastEval: Calculates time since the last evaluation
 ******************************************************************************/
import { ConvexError } from "convex/values";
import { IndexRangeBuilder, PaginationResult } from "convex/server";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

import type { PaginationOptsType, SortOrderType } from "./shared";
import type {
  StudyInType,
  StudyUpdateType,
  StudyStats,
  CardEvaluation,
  EvaluationStatus,
  StudyType,
} from "./studies_schema";

// Initialize study statistics with default values
export function initializeStudyStats(): StudyStats {
  return {
    correct: 0,
    incorrect: 0,
    partial: 0,
    skipped: 0,
    lastStudied: Date.now(), // Initialize lastStudied to now
  };
}

// Update study statistics based on a new evaluation
export function updateStudyStats(
  currentStats: StudyStats,
  status: EvaluationStatus,
): StudyStats {
  const now = Date.now();
  return {
    ...currentStats,
    [status]: (currentStats[status] || 0) + 1, // Ensure status count exists
    lastStudied: now,
  };
}

// Get all studies with pagination and optional filtering by userId and sorting
export async function getAllStudies(
  ctx: QueryCtx,
  paginationOpts: PaginationOptsType,
  userId?: Id<"users">,
  deckId?: Id<"decks">,
  sortOrder?: SortOrderType,
  afterThisCreationTime?: number,
  beforeThisCreationTime?: number,
): Promise<PaginationResult<Doc<"studies">>> {
  sortOrder = sortOrder || "desc"; // Default to showing the most recent studies first

  let results: PaginationResult<Doc<"studies">>;

  if (userId) {
    if (deckId) {
      results = await ctx.db
        .query("studies")
        .withIndex(
          "by_user_id_and_deck_id",
          (
            q: IndexRangeBuilder<
              Doc<"studies">,
              ["userId", "deckId", "_creationTime"],
              0
            >,
          ) => {
            return q
              .eq("userId", userId)
              .eq("deckId", deckId)
              .gt("_creationTime", afterThisCreationTime ?? 0)
              .lt(
                "_creationTime",
                beforeThisCreationTime ?? Number.MAX_SAFE_INTEGER,
              );
          },
        )
        .order(sortOrder)
        .paginate(paginationOpts);
    } else {
      results = await ctx.db
        .query("studies")
        .withIndex(
          "by_user_id",
          (
            q: IndexRangeBuilder<
              Doc<"studies">,
              ["userId", "_creationTime"],
              0
            >,
          ) => {
            return q
              .eq("userId", userId)
              .gt("_creationTime", afterThisCreationTime ?? 0)
              .lt(
                "_creationTime",
                beforeThisCreationTime ?? Number.MAX_SAFE_INTEGER,
              );
          },
        )
        .order(sortOrder)
        .paginate(paginationOpts);
    }
  } else {
    if (deckId) {
      results = await ctx.db
        .query("studies")
        .withIndex(
          "by_deck_id",
          (
            q: IndexRangeBuilder<
              Doc<"studies">,
              ["deckId", "_creationTime"],
              0
            >,
          ) => {
            return q
              .eq("deckId", deckId)
              .gt("_creationTime", afterThisCreationTime ?? 0)
              .lt(
                "_creationTime",
                beforeThisCreationTime ?? Number.MAX_SAFE_INTEGER,
              );
          },
        )
        .order(sortOrder)
        .paginate(paginationOpts);
    } else {
      results = await ctx.db
        .query("studies")
        .order(sortOrder)
        .paginate(paginationOpts);
    }
  }

  return {
    ...results,
    page: results.page, // Augment results if needed
  };
}

// Get a single study by ID, including the denormalized deck title
export async function getStudyById(
  ctx: QueryCtx,
  studyId: Id<"studies">,
): Promise<Doc<"studies">> {
  // Return the full StudyType
  const study = await ctx.db.get(studyId);
  if (!study) {
    throw new ConvexError({
      message: `Study ${studyId} not found`,
      code: 404,
    });
  }
  return study;
}

// Create a new study
export async function createStudy(
  ctx: MutationCtx,
  userId: Id<"users">,
  data: StudyInType,
): Promise<Id<"studies">> {
  // Fetch the deck to get the title for denormalization
  const deck = await ctx.db.get(data.deckId);
  if (!deck) {
    throw new ConvexError({
      message: `Deck ${data.deckId} not found for study creation`,
      code: 404,
    });
  }

  return await ctx.db.insert("studies", {
    ...data,
    userId,
    deckTitle: deck.title, // Store denormalized title
    stats: initializeStudyStats(), // Initialize stats on creation
    cardEvaluations: [], // Initialize evaluations array
  });
}

// Update a study (only fields defined in StudyUpdateType)
export async function updateStudy(
  ctx: MutationCtx,
  studyId: Id<"studies">,
  data: StudyUpdateType,
): Promise<void> {
  await ctx.db.patch(studyId, data);
}

// Record a card evaluation
export async function recordEvaluation(
  ctx: MutationCtx,
  studyId: Id<"studies">,
  evaluation: CardEvaluation,
): Promise<void> {
  const study = await getStudyById(ctx, studyId);
  const cardEvaluations = study.cardEvaluations || [];
  const stats = study.stats || initializeStudyStats();
  const updatedStats = updateStudyStats(stats, evaluation.status);

  await updateStudy(ctx, studyId, {
    cardEvaluations: [...cardEvaluations, evaluation],
    stats: updatedStats,
  });
}

// Mark a study as complete
export async function completeStudySession(
  ctx: MutationCtx,
  studyId: Id<"studies">,
  completionTime: number,
): Promise<void> {
  // Return void, mutation fetches if needed
  const study = await getStudyById(ctx, studyId);

  // Avoid updating if already completed
  if (study.completedAt) {
    return;
  }

  await ctx.db.patch(studyId, {
    completedAt: completionTime,
  });
}

// Delete a study given its ID.
export async function deleteStudy(
  ctx: MutationCtx,
  studyId: Id<"studies">,
): Promise<void> {
  await ctx.db.delete(studyId);
}

// Delete all studies for a user or all studies in the system.
export async function deleteAllStudies(
  ctx: MutationCtx,
  userId?: Id<"users">,
  deckId?: Id<"decks">,
  afterThisCreationTime?: number,
  beforeThisCreationTime?: number,
): Promise<number> {
  // Use getAllStudies with a large numItems to get all records
  const { page: studies } = await getAllStudies(
    ctx,
    { numItems: Number.MAX_SAFE_INTEGER, cursor: null },
    userId,
    deckId,
    "asc", // Order doesn't matter for deletion
    afterThisCreationTime,
    beforeThisCreationTime,
  );

  const deletePromises = studies.map((study) => deleteStudy(ctx, study._id));

  // Consider batching deletes if Convex supports it directly in the future,
  // or implement manual batching with Promise.allSettled and retries for robustness.
  await Promise.all(deletePromises);

  return studies.length;
}
