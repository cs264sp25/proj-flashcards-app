/******************************************************************************
 * USERS SCHEMA MODULE
 *
 * This module defines the schema and types for users in the application.
 ******************************************************************************/
import { defineTable } from "convex/server";
import { Infer, v } from "convex/values";

/**
 * Type representing the fields that can be provided when updating a user
 */
export const userUpdateSchema = {
  name: v.optional(v.string()),
  imageFileStorageId: v.optional(v.id("_storage")),
  displayName: v.optional(v.string()),
};

// eslint-disable-next-line
const userUpdateSchemaObject = v.object(userUpdateSchema);
export type UserUpdateType = Infer<typeof userUpdateSchemaObject>;

/**
 * Type representing a user in the database. These are all defined as optional
 * because different auth providers may provide different fields
 */
export const userSchema = {
  // The following fields are what Convex Auth defines in the user schema
  // name: v.optional(v.string()), // Already defined in userUpdateSchema
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),
  // These are additional fields
  ...userUpdateSchema,
  // Convex will automatically add `_id` and `_creationTime` fields to the schema
};

// eslint-disable-next-line
const userSchemaObject = v.object(userSchema);
export type UserType = Infer<typeof userSchemaObject>;

/**
 * User table schema definition
 */
export const userTables = {
  users: defineTable(userSchema).index("email", ["email"]),
};
