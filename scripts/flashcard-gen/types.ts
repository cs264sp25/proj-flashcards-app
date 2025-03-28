import { z } from "zod";

export const FileInfoSchema = z.object({
  folder: z.string(),
  path: z.string(),
  filename: z.string(),
  isIndex: z.boolean(),
});

export type FileInfo = z.infer<typeof FileInfoSchema>;

export const FlashcardSchema = z.object({
  front: z.string(),
  back: z.string(),
});

export type Flashcard = z.infer<typeof FlashcardSchema>;

export const DeckSchema = z.object({
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  flashcards: z.array(FlashcardSchema),
});

export type Deck = z.infer<typeof DeckSchema>;
