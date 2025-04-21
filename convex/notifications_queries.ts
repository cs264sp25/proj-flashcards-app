/******************************************************************************
 * QUERIES
 *
 * Responsibility chain:
 * 1. Authentication check (using auth guard)
 * 2. Authorization check (using notification guard)
 * 3. Data operation (using helpers)
 *
 * Available queries:
 * - getAll: List user's notifications
 * - getOne: Get single notification
 * - getUnreadCount: Get the count of unread notifications
 ******************************************************************************/

import { paginationOptsValidator, PaginationResult } from "convex/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, query } from "./_generated/server";

import { PaginationOptsType, SortOrder, SortOrderType } from "./shared";
import { authenticationGuard } from "./users_guards";
import {
  getAllNotifications,
  getNotificationById,
} from "./notifications_helpers";
import { ownershipGuard } from "./notifications_guards";
import { NotificationOutType } from "./notifications_schema";
import { aggregate } from "./notifications_aggregates";

/**
 * Get all notifications for the authenticated user, optionally sorted by the given order
 */
export const getAll = query({
  args: {
    paginationOpts: paginationOptsValidator,
    sortOrder: v.optional(SortOrder),
    isRead: v.optional(v.boolean()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      sortOrder?: SortOrderType;
      isRead?: boolean;
      searchQuery?: string;
    },
  ): Promise<PaginationResult<NotificationOutType>> => {
    const userId = await authenticationGuard(ctx);
    const results = await getAllNotifications(
      ctx,
      args.paginationOpts,
      userId,
      args.isRead,
      args.sortOrder,
      args.searchQuery,
    );

    return {
      ...results,
      page: results.page.map((notification) => ({
        _id: notification._id,
        _creationTime: notification._creationTime,
        title: notification.title,
        description: notification.description,
        is_read: notification.is_read,
        userId: notification.userId,
        // We don't need to send the searchableContent to the client
      })),
    };
  },
});

/**
 * Get a single notification by ID.
 * The authenticated user must own the notification, or an error is thrown.
 */
export const getOne = query({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      notificationId: Id<"notifications">;
    },
  ): Promise<NotificationOutType> => {
    const userId = await authenticationGuard(ctx);
    const notification = await getNotificationById(ctx, args.notificationId);
    ownershipGuard(userId, notification.userId);
    return {
      _id: notification._id,
      _creationTime: notification._creationTime,
      title: notification.title,
      description: notification.description,
      is_read: notification.is_read,
      userId: notification.userId,
      // We don't need to send the searchableContent to the client
    };
  },
});

/**
 * Get the count of unread notifications for the authenticated user
 */
export const getUnreadCount = query({
  handler: async (ctx: QueryCtx) => {
    const userId = await authenticationGuard(ctx);
    const tableCount = await aggregate.sum(ctx, {
      namespace: userId,
      bounds: {},
    });
    return tableCount;
  },
});
