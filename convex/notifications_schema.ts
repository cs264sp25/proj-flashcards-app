/******************************************************************************
 * SCHEMA
 *
 * Defines types and database schema for notifications:
 * - NotificationInType: Fields that can be provided when creating a notification
 * - NotificationUpdateType: Fields that can be updated
 * - NotificationType: Complete notification document type including system fields
 * - NotificationOutType: Fields that can be returned from queries
 *
 * Database Indexes:
 * - by_user_id: Efficient querying of notifications by user
 * - by_user_id_and_is_read: Efficient querying of notifications by user and read status
 * - search_all: Full-text search index on searchableContent
 ******************************************************************************/

import { defineTable } from "convex/server";
import { Infer, v } from "convex/values";

/**
 * Type representing the fields that can be provided when creating a notification
 */
export const notificationInSchema = {
  title: v.string(),
  description: v.optional(v.string()),
  is_read: v.boolean(),
};

// eslint-disable-next-line
const notificationInSchemaObject = v.object(notificationInSchema);
export type NotificationInType = Infer<typeof notificationInSchemaObject>;

/**
 * Type representing the fields that can be provided when updating a notification
 */
export const notificationUpdateSchema = {
  ...notificationInSchema,
  title: v.optional(v.string()),
  is_read: v.optional(v.boolean()),
};

// eslint-disable-next-line
const notificationUpdateSchemaObject = v.object(notificationUpdateSchema);
export type NotificationUpdateType = Infer<
  typeof notificationUpdateSchemaObject
>;

/**
 * Type representing a notification in the database
 */
export const notificationSchema = {
  // Convex will automatically add `_id` and `_creationTime` fields to the schema
  ...notificationInSchema,
  userId: v.id("users"),
  // Combined field for full-text search
  searchableContent: v.string(),
};

// eslint-disable-next-line
const notificationSchemaObject = v.object(notificationSchema);
export type NotificationType = Infer<typeof notificationSchemaObject>;

/**
 * Type representing a notification returned from queries
 */
export const notificationOutSchema = {
  _id: v.id("notifications"),
  _creationTime: v.number(),
  ...notificationInSchema,
  userId: v.id("users"),
  // We don't need to return the searchableContent field
};

// eslint-disable-next-line
const notificationOutSchemaObject = v.object(notificationOutSchema);
export type NotificationOutType = Infer<typeof notificationOutSchemaObject>;

/**
 * Notification table schema definition
 */
export const notificationTables = {
  notifications: defineTable(notificationSchema)
    // Index for efficient querying by user
    .index("by_user_id", ["userId"])
    // Index for efficient querying by user and read status
    .index("by_user_id_and_is_read", ["userId", "is_read"])
    // Full-text search index
    .searchIndex("search_all", {
      searchField: "searchableContent",
      filterFields: ["userId"],
    }),
};
