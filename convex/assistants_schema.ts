/******************************************************************************
 * SCHEMA
 *
 * Defines types and database schema for assistants:
 * - AssistantInType: Fields for creating assistants
 * - AssistantUpdateType: Fields that can be updated
 * - AssistantType: Complete assistant document type in the database
 * - AssistantOutType: Client-facing assistant type
 *
 * Database Indexes:
 * - by_name: Efficient querying of assistants by name
 ******************************************************************************/

import { Infer, v } from "convex/values";
import { defineTable } from "convex/server";

// Define the types of tools an assistant can use
const toolType = v.union(
  v.literal("file_search"),
  v.literal("code_interpreter"),
  // v.literal("function"),
);

// Schema for a single tool configuration
const toolSchema = v.object({
  type: toolType,
});

/**
 * Type representing the fields that can be provided when creating an assistant.
 * Does not include openaiAssistantId, which is managed internally.
 */
export const assistantInSchema = {
  name: v.string(),
  description: v.optional(v.string()),
  instructions: v.optional(v.string()),
  model: v.string(), // We'll use the default model in mutations if not specified
  temperature: v.optional(v.number()),
  metadata: v.optional(v.record(v.string(), v.string())),
  tools: v.optional(v.array(toolSchema)),
};

// eslint-disable-next-line
const assistantInSchemaObject = v.object(assistantInSchema);
export type AssistantInType = Infer<typeof assistantInSchemaObject>;

/**
 * Type representing the fields that can be provided when updating an assistant.
 * All fields are optional, and openaiAssistantId cannot be updated directly.
 */
export const assistantUpdateSchema = {
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  instructions: v.optional(v.string()),
  model: v.optional(v.string()),
  temperature: v.optional(v.number()),
  metadata: v.optional(v.record(v.string(), v.string())),
  tools: v.optional(v.array(toolSchema)),
};

// eslint-disable-next-line
const assistantUpdateSchemaObject = v.object(assistantUpdateSchema);
export type AssistantUpdateType = Infer<typeof assistantUpdateSchemaObject>;

/**
 * Type representing an assistant as stored in the database.
 * Includes the openaiAssistantId managed internally.
 */
export const assistantSchema = {
  // Convex automatically adds _id and _creationTime
  ...assistantInSchema,
  openaiAssistantId: v.optional(v.string()), // Managed internally, can be 'pending'
  // Combined field for full-text search
  searchableContent: v.string(), // name + description
};

// eslint-disable-next-line
const assistantSchemaObject = v.object(assistantSchema);
export type AssistantType = Infer<typeof assistantSchemaObject>;

/**
 * Type representing an assistant as returned to the client.
 * Includes Convex-generated fields _id and _creationTime.
 */
export const assistantOutSchema = {
  // Allow _id to be the actual DB ID or the literal 'default'
  _id: v.id("assistants"),
  _creationTime: v.number(),
  ...assistantInSchema,
};

// eslint-disable-next-line
const assistantOutSchemaObject = v.object(assistantOutSchema);
export type AssistantOutType = Infer<typeof assistantOutSchemaObject>;

/**
 * Assistant table schema definition.
 */
export const assistantTables = {
  assistants: defineTable(assistantSchema)
    // Full-text search index
    .searchIndex("search_all", {
      searchField: "searchableContent",
    }),
};
