/******************************************************************************
 * SCHEMA
 *
 * Defines types and database schema for chats:
 * - ChatInType: Fields for creating/updating chats
 * - ChatUpdateType: Fields that can be updated
 * - ChatType: Complete chat document type
 * - ChatOutType: Client-facing chat type
 *
 * Database Indexes:
 * - by_user_id: Efficient querying of chats by user
 * - search_all: Full-text search index on searchableContent
 ******************************************************************************/

import { defineTable } from "convex/server";
import { Infer, v } from "convex/values";

/**
 * Type representing the fields that can be provided when creating a chat
 */
export const chatInSchema = {
  title: v.string(),
  description: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
};

// eslint-disable-next-line
const chatInSchemaObject = v.object(chatInSchema);
export type ChatInType = Infer<typeof chatInSchemaObject>;

/**
 * Type representing the fields that can be provided when updating a chat
 */
export const chatUpdateSchema = {
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
};

// eslint-disable-next-line
const chatUpdateSchemaObject = v.object(chatUpdateSchema);
export type ChatUpdateType = Infer<typeof chatUpdateSchemaObject>;

/**
 * Type representing a chat in the database
 */
export const chatSchema = {
  // Convex will automatically add `_id` and `_creationTime` fields to the schema
  ...chatInSchema,
  messageCount: v.number(),
  userId: v.id("users"),
  // Combined field for full-text search
  searchableContent: v.string(),
};

// eslint-disable-next-line
const chatSchemaObject = v.object(chatSchema);
export type ChatType = Infer<typeof chatSchemaObject>;

/**
 * Type representing a chat as returned to the client
 */
export const chatOutSchema = {
  _id: v.id("chats"),
  _creationTime: v.number(),
  ...chatInSchema,
  messageCount: v.number(),
  userId: v.id("users"),
  // We don't need to return the searchableContent field
};

// eslint-disable-next-line
const chatOutSchemaObject = v.object(chatOutSchema);
export type ChatOutType = Infer<typeof chatOutSchemaObject>;

/**
 * Chat table schema definition
 */
export const chatTables = {
  chats: defineTable(chatSchema)
    // Index for efficient querying by user
    .index("by_user_id", ["userId"])
    // Full-text search index
    .searchIndex("search_all", {
      searchField: "searchableContent",
      filterFields: ["userId"],
    }),
};
