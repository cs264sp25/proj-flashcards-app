/******************************************************************************
 * SCHEMA
 *
 * Defines types and database schema for files:
 * - FileInType: Fields that can be provided when creating/updating
 * - FileUpdateType: Fields that can be updated
 * - FileType: Complete file document type including system fields
 * - FileTables: Database schema definition
 *
 * Database Indexes:
 * - by_user_id: Efficient querying of files by user
 ******************************************************************************/

import { defineTable } from "convex/server";
import { Infer, v } from "convex/values";

/**
 * Type representing the fields that can be provided when creating a file
 */
export const fileInSchema = {
  title: v.string(),
  description: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  storageId: v.id("_storage"),
};

// eslint-disable-next-line
const fileInSchemaObject = v.object(fileInSchema);
export type FileInType = Infer<typeof fileInSchemaObject>;

/**
 * Type representing the fields that can be provided when updating a file
 */
export const fileUpdateSchema = {
  ...fileInSchema,
  title: v.optional(v.string()),
  storageId: v.optional(v.id("_storage")),
};

// eslint-disable-next-line
const fileUpdateSchemaObject = v.object(fileUpdateSchema);
export type FileUpdateType = Infer<typeof fileUpdateSchemaObject>;

/**
 * Type representing a file in the database
 */
export const fileSchema = {
  // Convex will automatically add `_id` and `_creationTime` fields to the schema
  ...fileInSchema,
  userId: v.id("users"),
  url: v.string(),
};

// eslint-disable-next-line
const fileSchemaObject = v.object(fileSchema);
export type FileType = Infer<typeof fileSchemaObject>;

/**
 * Type representing a file returned from queries
 */
export const fileOutSchema = {
  _id: v.id("files"),
  _creationTime: v.number(),
  ...fileInSchema,
};

// eslint-disable-next-line
const fileOutSchemaObject = v.object(fileOutSchema);
export type FileOutType = Infer<typeof fileOutSchemaObject>;

/**
 * File table schema definition
 */
export const fileTables = {
  files: defineTable(fileSchema).index("by_user_id", ["userId"]),
};
