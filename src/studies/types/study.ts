import { Id } from "@convex-generated/dataModel";
import { z } from "zod";

export const evaluationStatusSchema = z.enum([
  "correct",
  "incorrect",
  "partial",
  "skipped",
]);

export const cardEvaluationSchema = z.object({
  cardId: z.custom<Id<"cards">>(),
  status: evaluationStatusSchema,
  evaluatedAt: z.number(),
});

export const studyStatsSchema = z.object({
  correct: z.number().min(0),
  incorrect: z.number().min(0),
  partial: z.number().min(0),
  skipped: z.number().min(0),
  lastStudied: z.number(),
});

export const createStudySchema = z.object({
  deckId: z.custom<Id<"decks">>(),
});

export const updateStudySchema = z.object({
  cardEvaluations: z.array(cardEvaluationSchema).optional(),
  stats: studyStatsSchema.optional(),
});

export const studySchema = createStudySchema.extend({
  _id: z.custom<Id<"studies">>(),
  _creationTime: z.number(),
  userId: z.custom<Id<"users">>(),
  deckTitle: z.string().optional(),
  cardEvaluations: z.array(cardEvaluationSchema).optional(),
  stats: studyStatsSchema.optional(),
  completedAt: z.number().optional(),
});

export type EvaluationStatus = z.infer<typeof evaluationStatusSchema>;
export type CardEvaluation = z.infer<typeof cardEvaluationSchema>;
export type StudyStats = z.infer<typeof studyStatsSchema>;
export type CreateStudyType = z.infer<typeof createStudySchema>;
export type UpdateStudyType = z.infer<typeof updateStudySchema>;
export type StudyType = z.infer<typeof studySchema>;
