/******************************************************************************
 * INTERNALS
 *
 * Internal operations not exposed to clients:
 * - Used by other operations like seeding and AI actions
 * - Bypasses auth/authorization for internal use
 ******************************************************************************/

import { v } from "convex/values";
import { PaginationResult, paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";
import { QueryCtx, internalQuery, internalMutation } from "./_generated/server";

import { PaginationOptsType, SortOrder, SortOrderType } from "./shared";
import {
  notificationInSchema,
  NotificationOutType,
  notificationUpdateSchema,
} from "./notifications_schema";
import {
  getAllNotifications as getAllNotificationsHelper,
  createNotification as createOne,
  deleteAllNotifications as removeAll,
  updateNotification,
} from "./notifications_helpers";

/**
 * Get all notifications for the given user.
 * An internal query wrapper around the getAllNotifications helper.
 * Used when we want to get notifications in a different context (ctx) like in seeding Actions.
 */
export const getAllNotifications = internalQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    isRead: v.optional(v.boolean()),
    sortOrder: v.optional(SortOrder),
    userId: v.id("users"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      isRead?: boolean;
      sortOrder?: SortOrderType;
      userId: Id<"users">;
    },
  ): Promise<PaginationResult<NotificationOutType>> => {
    return await getAllNotificationsHelper(
      ctx,
      args.paginationOpts,
      args.userId,
      args.isRead,
      args.sortOrder,
    );
  },
});

/**
 * Create a new notification for the given user.
 * An internal mutation wrapper around the createNotification helper.
 * Used when we want to create a notification in a different context (ctx) like in seeding Actions.
 */
export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    notification: v.object(notificationInSchema),
  },
  handler: async (ctx, args) => {
    return await createOne(ctx, args.userId, args.notification);
  },
});

/**
 * Update an existing notification.
 * An internal mutation wrapper around the updateNotification helper.
 * Used when we want to update a notification in a different context (ctx) like in seeding Actions.
 */
export const update = internalMutation({
  args: {
    notificationId: v.id("notifications"),
    ...notificationUpdateSchema,
  },
  handler: async (ctx, args) => {
    const { notificationId, ...data } = args;
    await updateNotification(ctx, notificationId, data);
    return true;
  },
});

/**
 * Delete all notification for the given user.
 * An internal mutation wrapper around the deleteAllNotifications helper.
 * Used when we want to delete notification in a different context (ctx) like in seeding Actions.
 */
export const deleteNotifications = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await removeAll(ctx, args.userId);
  },
});
