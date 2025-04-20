/******************************************************************************
 * HELPERS
 *
 * Pure database operations without auth/authorization checks:
 * - Core CRUD operations:
 *   - getAllNotifications: Basic notification retrieval with optional filters
 *   - getNotificationById: Single notification retrieval
 *   - createNotification: Basic notification creation
 *   - updateNotification: Basic notification update
 *   - deleteNotification: Basic notification deletion
 * - Special operations:
 *   - updateReadStatusOfAllNotifications: Updates read status of all notifications
 *   - deleteAllNotifications: Deletes all notifications
 ******************************************************************************/

import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";
import { IndexRangeBuilder, PaginationResult } from "convex/server";

import type { PaginationOptsType, SortOrderType } from "./shared";
import type {
  NotificationInType,
  NotificationUpdateType,
} from "./notifications_schema";
import { aggregate } from "./notifications_aggregates";

// Get all notifications with pagination and optional filtering by userId and sorting
export async function getAllNotifications(
  ctx: QueryCtx,
  paginationOpts: PaginationOptsType,
  userId?: Id<"users">,
  isRead?: boolean,
  sortOrder?: SortOrderType,
  searchQuery?: string,
) {
  sortOrder = sortOrder || "desc"; // We want to show the latest notifications first

  let results: PaginationResult<Doc<"notifications">>;

  if (searchQuery) {
    results = await ctx.db
      .query("notifications")
      .withSearchIndex("search_all", (q) => {
        if (userId) {
          return q
            .search("searchableContent", searchQuery)
            .eq("userId", userId);
        } else {
          return q.search("searchableContent", searchQuery);
        }
      })
      // The order will be the order of the search results
      .paginate(paginationOpts);
  } else if (isRead) {
    if (!userId) {
      throw new ConvexError({
        message: "userId is required when filtering by isRead",
        code: 400,
      });
    }

    results = await ctx.db
      .query("notifications")
      .withIndex(
        "by_user_id_and_is_read",
        (
          q: IndexRangeBuilder<
            Doc<"notifications">,
            ["userId", "is_read", "_creationTime"],
            0
          >,
        ) => {
          return q.eq("userId", userId).eq("is_read", isRead);
        },
      )
      .order(sortOrder)
      .paginate(paginationOpts);
  } else {
    results = await ctx.db
      .query("notifications")
      .withIndex(
        "by_user_id",
        (
          q: IndexRangeBuilder<
            Doc<"notifications">,
            ["userId", "_creationTime"],
            0
          >,
        ) => {
          let q1;

          if (userId) {
            q1 = q.eq("userId", userId);
          }

          return q1 || q;
        },
      )
      .order(sortOrder)
      .paginate(paginationOpts);
  }

  return {
    ...results,
    page: results.page, // This is the data (records) for the current page; we can transform it if needed
  };
}

export async function getNotificationById(
  ctx: QueryCtx,
  notificationId: Id<"notifications">,
) {
  const notification = await ctx.db.get(notificationId);
  if (!notification) {
    throw new ConvexError({
      message: `Notification ${notificationId} not found`,
      code: 404,
    });
  }
  return notification;
}

// Also updates the aggregate table
export async function createNotification(
  ctx: MutationCtx,
  userId: Id<"users">,
  data: NotificationInType,
) {
  const title = data.title || "";
  const description = data.description || "";
  const searchableContent = `${title.trim()} ${description.trim()}`;

  const id = await ctx.db.insert("notifications", {
    ...data,
    userId,
    searchableContent,
  });

  // Get the newly created notification
  const doc = await ctx.db.get(id);
  // Insert the notification into the aggregate table
  await aggregate.insert(ctx, doc!);

  return id;
}

// Also updates the aggregate table
export async function updateNotification(
  ctx: MutationCtx,
  notificationId: Id<"notifications">,
  data: NotificationUpdateType,
) {
  const oldDoc = await ctx.db.get(notificationId);

  const title = data.title || oldDoc?.title || "";
  const description = data.description || oldDoc?.description || "";
  const searchableContent = `${title.trim()} ${description.trim()}`;

  await ctx.db.patch(notificationId, {
    ...data,
    searchableContent,
  });

  // Get the updated notification
  const newDoc = await ctx.db.get(notificationId);
  // Replace the old notification in the aggregate table
  await aggregate.replace(ctx, oldDoc!, newDoc!);
}

// Also updates the aggregate table
export async function deleteNotification(
  ctx: MutationCtx,
  notificationId: Id<"notifications">,
) {
  const oldDoc = await ctx.db.get(notificationId);
  // Delete the notification from the database
  await ctx.db.delete(notificationId);
  // Delete the notification from the aggregate table
  await aggregate.delete(ctx, oldDoc!);
}

// Can be used to update the read status of all notifications for a user
// This function currently updates all unread notifications to read
// TODO: This function is not efficient for large datasets. It should be
// changed to batch update notification over scheduled actions.
export async function updateReadStatusOfAllNotifications(
  ctx: MutationCtx,
  userId: Id<"users">,
) {
  const notifications = await ctx.db
    .query("notifications")
    .withIndex(
      "by_user_id_and_is_read",
      (
        q: IndexRangeBuilder<
          Doc<"notifications">,
          ["userId", "is_read", "_creationTime"],
          0
        >,
      ) => {
        return q.eq("userId", userId).eq("is_read", false);
      },
    )
    .collect();

  await Promise.all(
    notifications.map((notification) =>
      updateNotification(ctx, notification._id, { is_read: true }),
    ),
  );

  return notifications.length;
}

// Can be used to delete all notification for a user or all notification in the system.
// When deleting all notifications for a user, we can also filter by isRead.
// TODO: This function is not efficient for large datasets. It should be
// changed to batch delete notification over scheduled actions.
export async function deleteAllNotifications(
  ctx: MutationCtx,
  userId?: Id<"users">,
  isRead?: boolean,
) {
  let notifications;

  if (isRead) {
    if (!userId) {
      throw new ConvexError({
        message: "userId is required when filtering by isRead",
        code: 400,
      });
    }

    notifications = await ctx.db
      .query("notifications")
      .withIndex(
        "by_user_id_and_is_read",
        (
          q: IndexRangeBuilder<
            Doc<"notifications">,
            ["userId", "is_read", "_creationTime"],
            0
          >,
        ) => {
          return q.eq("userId", userId).eq("is_read", isRead);
        },
      )
      .collect();
  } else {
    notifications = await ctx.db
      .query("notifications")
      .withIndex(
        "by_user_id",
        (
          q: IndexRangeBuilder<
            Doc<"notifications">,
            ["userId", "_creationTime"],
            0
          >,
        ) => {
          let q1;

          if (userId) {
            q1 = q.eq("userId", userId);
          }

          return q1 || q;
        },
      )
      .collect();
  }

  await Promise.all(
    notifications.map((notification) =>
      deleteNotification(ctx, notification._id),
    ),
  );

  return notifications.length;
}
