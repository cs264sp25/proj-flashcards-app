import { z } from "zod";

export const createDeckSchema = z.object({
  title: z.string().min(1),
  description: z.optional(z.string().min(1)),
  tags: z.optional(z.array(z.string())),
});

export const updateDeckSchema = createDeckSchema.partial();

export const deckSchema = createDeckSchema.extend({
  _id: z.string(),
  _creationTime: z.number(),
  cardCount: z.number().min(0),
  userId: z.string(),
});

export type CreateDeckType = z.infer<typeof createDeckSchema>;
export type UpdateDeckType = z.infer<typeof updateDeckSchema>;
export type DeckType = z.infer<typeof deckSchema>;
