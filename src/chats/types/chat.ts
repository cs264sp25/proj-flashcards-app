import { z } from "zod";

export const createChatSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  tags: z.optional(z.array(z.string())),
  assistantId: z.string().optional(),
});

export const updateChatSchema = createChatSchema.partial();

export const chatSchema = createChatSchema.extend({
  _id: z.string(),
  _creationTime: z.number(),
  messageCount: z.number(),
});

export type CreateChatType = z.infer<typeof createChatSchema>;
export type UpdateChatType = z.infer<typeof updateChatSchema>;
export type ChatType = z.infer<typeof chatSchema>;
