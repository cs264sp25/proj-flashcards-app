/******************************************************************************
 * SCHEMA
 *
 * Defines types and database schema for studies:
 * - EvaluationStatus: Possible outcomes for evaluating a card
 * - CardEvaluation: Structure for a single card evaluation record
 * - StudyStats: Statistics tracked during a study session
 * - StudyInType: Fields for creating a new study
 * - StudyUpdateType: Fields allowed for updating a study
 * - StudyType: Complete study document type including system fields
 *
 * Database Indexes:
 * - by_user_id: Efficient querying of studies by user
 * - by_deck_id: Efficient querying of studies by deck
 ******************************************************************************/
import { defineTable } from "convex/server";
import { Infer, v } from "convex/values";

/**
 * Type representing a card evaluation status
 */
export const evaluationStatusSchema = v.union(
  v.literal("correct"),
  v.literal("incorrect"),
  v.literal("partial"),
  v.literal("skipped"),
);

export type EvaluationStatus = Infer<typeof evaluationStatusSchema>;

/**
 * Type representing a single card evaluation
 */
export const cardEvaluationSchema = v.object({
  cardId: v.id("cards"),
  status: evaluationStatusSchema,
  evaluatedAt: v.number(), // timestamp
});

export type CardEvaluation = Infer<typeof cardEvaluationSchema>;

/**
 * Type representing study statistics
 */
export const studyStatsSchema = v.object({
  correct: v.number(),
  incorrect: v.number(),
  partial: v.number(),
  skipped: v.number(),
  lastStudied: v.number(), // timestamp of last card evaluation
});

export type StudyStats = Infer<typeof studyStatsSchema>;

/**
 * Type representing the fields that can be provided when creating a study
 */
export const studyInSchema = {
  deckId: v.id("decks"),
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const studyInSchemaObject = v.object(studyInSchema);
export type StudyInType = Infer<typeof studyInSchemaObject>;

/**
 * Type representing the fields that can be provided when updating a study
 * Note: We don't allow updating the deckId or userId directly via standard updates.
 *       Completion status is managed via specific complete/resume actions.
 */
export const studyUpdateSchema = {
  cardEvaluations: v.optional(v.array(cardEvaluationSchema)),
  stats: v.optional(studyStatsSchema),
  // deckTitle might be updated if the source deck's title changes, handled internally.
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const studyUpdateSchemaObject = v.object(studyUpdateSchema);
export type StudyUpdateType = Infer<typeof studyUpdateSchemaObject>;

/**
 * Type representing a study document in the database
 * Includes system fields (_id, _creationTime) and user/deck associations.
 */
export const studySchema = {
  ...studyInSchema, // deckId
  userId: v.id("users"),
  deckTitle: v.optional(v.string()), // Denormalized for easier display
  cardEvaluations: v.optional(v.array(cardEvaluationSchema)),
  stats: v.optional(studyStatsSchema),
  completedAt: v.optional(v.number()), // Timestamp when study was completed
  // Convex automatically adds `_id` and `_creationTime` fields
  // _creationTime serves as the study start time
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const studySchemaObject = v.object(studySchema);
export type StudyType = Infer<typeof studySchemaObject>;

/**
 * Study table schema definition
 */
export const studyTables = {
  studies: defineTable(studySchema)
    .index("by_user_id", ["userId"])
    .index("by_deck_id", ["deckId"])
    .index("by_user_id_and_deck_id", ["userId", "deckId"]),
};
