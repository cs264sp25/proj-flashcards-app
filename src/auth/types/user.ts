import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().optional(),
  imageFileStorageId: z.string().optional(),
  displayName: z.string().optional(),
});

export const userSchema = updateUserSchema.extend({
  _id: z.string(),
  _creationTime: z.number(),
  email: z.string().optional(),
  image: z.string().optional(),
});

export type UpdateUserType = z.infer<typeof updateUserSchema>;
export type UserType = z.infer<typeof userSchema>;
