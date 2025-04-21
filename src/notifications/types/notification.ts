import { z } from "zod";

// User does not create notifications, they are created by the system.
// So, we don't have a createNotificationSchema.

export const updateNotificationSchema = z.object({
  isRead: z.boolean(),
});

export const notificationSchema = z.object({
  _id: z.string(),
  _creationTime: z.number(),
  userId: z.string(),
  is_read: z.boolean(),
  title: z.string(),
  description: z.optional(z.string()),
});

export type UpdateNotificationType = z.infer<typeof updateNotificationSchema>;
export type NotificationType = z.infer<typeof notificationSchema>;
