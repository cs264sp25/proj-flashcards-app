import { z } from "zod";

export const createCardSchema = z.object({
  front: z.string().min(1).max(1000),
  back: z.string().min(1).max(1000),
});

export const updateCardSchema = createCardSchema.partial();

export const cardSchema = createCardSchema.extend({
  _id: z.string(),
  _creationTime: z.number(),
  deckId: z.string(),
});

export type CreateCardType = z.infer<typeof createCardSchema>;
export type UpdateCardType = z.infer<typeof updateCardSchema>;
export type CardType = z.infer<typeof cardSchema>;
