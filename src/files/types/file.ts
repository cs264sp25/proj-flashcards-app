import { Id } from "@convex-generated/dataModel";
import { z } from "zod";

export const createFileSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  tags: z.optional(z.array(z.string())),
  file: z.optional(z.instanceof(File)),
});

export const updateFileSchema = createFileSchema.partial();

export const fileSchema = createFileSchema.extend({
  _id: z.string(),
  _creationTime: z.number(),
  userId: z.string(),
  storageId: z.string(),
  url: z.string(),
});

export type CreateFileType = z.infer<typeof createFileSchema>;
export type UpdateFileType = z.infer<typeof updateFileSchema>;
export type FileType = z.infer<typeof fileSchema>;
