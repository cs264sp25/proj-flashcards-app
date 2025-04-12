import { z } from "zod";

export const toolSchema = z.object({
  type: z.union([z.literal("file_search"), z.literal("code_interpreter")]),
});

export const createAssistantSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  instructions: z.string().optional(),
  model: z.string().optional(),
  temperature: z.optional(z.number()),
  metadata: z.optional(z.record(z.string())),
  tools: z.optional(z.array(toolSchema)),
});

export const updateAssistantSchema = createAssistantSchema.partial();

export const assistantSchema = createAssistantSchema.extend({
  _id: z.string(),
  _creationTime: z.number(),
});

export type CreateAssistantType = z.infer<typeof createAssistantSchema>;
export type UpdateAssistantType = z.infer<typeof updateAssistantSchema>;
export type AssistantType = z.infer<typeof assistantSchema>;
