/******************************************************************************
 * MUTATIONS
 *
 * Responsibility chain:
 * 1. Authentication check (using auth guard)
 * 2. Authorization check (using notification guard)
 * 3. Data operation (using helpers)
 *
 * Available mutations:
 * - update: Toggle the read status of a notification
 * - remove: Delete a notification
 * - readAllUnread: Update the read status of all notifications
 * - removeAll: Delete all notifications
 ******************************************************************************/

import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { MutationCtx, mutation } from "./_generated/server";

import { authenticationGuard } from "./users_guards";
import { ownershipGuard } from "./notifications_guards";
import {
  updateNotification,
  deleteNotification,
  getNotificationById,
  deleteAllNotifications,
  updateReadStatusOfAllNotifications,
} from "./notifications_helpers";

// User do not create notification! It is created by the system.
// So, we will use the internal mutations to create notification.

/**
 * Toggle the read status of a notification.
 * The authenticated user must own the notification, or an error is thrown.
 */
export const update = mutation({
  args: {
    notificationId: v.id("notifications"),
    isRead: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { notificationId, isRead } = args;
    const userId = await authenticationGuard(ctx);
    const notification = await getNotificationById(ctx, notificationId);
    ownershipGuard(userId, notification.userId);
    await updateNotification(ctx, notificationId, {
      is_read: isRead,
    });
    return true;
  },
});

/**
 * Delete a notification.
 * The authenticated user must own the notification, or an error is thrown.
 */
export const remove = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      notificationId: Id<"notifications">;
    },
  ): Promise<boolean> => {
    const userId = await authenticationGuard(ctx);
    const notification = await getNotificationById(ctx, args.notificationId);
    ownershipGuard(userId, notification.userId);
    await deleteNotification(ctx, args.notificationId);
    return true;
  },
});

/**
 * Update the read status of all notifications for the authenticated user.
 * This function currently updates all unread notifications to read.
 */
export const readAllUnread = mutation({
  handler: async (ctx: MutationCtx) => {
    const userId = await authenticationGuard(ctx);
    const count = await updateReadStatusOfAllNotifications(ctx, userId);
    return count;
  },
});

/**
 * Delete all notification for the authenticated user, optionally filtered by isRead.
 */
export const removeAll = mutation({
  args: {
    isRead: v.optional(v.boolean()),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      isRead?: boolean;
    },
  ): Promise<number> => {
    const userId = await authenticationGuard(ctx);
    const count = await deleteAllNotifications(ctx, userId, args.isRead);
    return count;
  },
});
