/******************************************************************************
 * SCHEMA
 *
 * Defines types and database schema for decks:
 * - DeckInType: Fields that can be provided when creating/updating
 * - DeckUpdateType: Fields that can be updated
 * - DeckType: Complete deck document type including system fields
 * - DeckOutType: Fields that can be returned from queries
 *
 * Database Indexes:
 * - by_user_id: Efficient querying of decks by user
 * - search_all: Full-text search index on searchableContent
 * - by_embedding: Vector similarity search index
 ******************************************************************************/

import { defineTable } from "convex/server";
import { Infer, v } from "convex/values";

/**
 * Type representing the fields that can be provided when creating a deck
 */
export const deckInSchema = {
  title: v.string(),
  description: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
};

// eslint-disable-next-line
const deckInSchemaObject = v.object(deckInSchema);
export type DeckInType = Infer<typeof deckInSchemaObject>;

/**
 * Type representing the fields that can be provided when updating a deck
 */
export const deckUpdateSchema = {
  ...deckInSchema,
  title: v.optional(v.string()),
};

// eslint-disable-next-line
const deckUpdateSchemaObject = v.object(deckUpdateSchema);
export type DeckUpdateType = Infer<typeof deckUpdateSchemaObject>;

/**
 * Type representing a deck in the database
 */
export const deckSchema = {
  // Convex will automatically add `_id` and `_creationTime` fields to the schema
  ...deckInSchema,
  cardCount: v.number(),
  userId: v.id("users"),
  // Combined field for full-text search
  searchableContent: v.string(),
  // Vector embedding for similarity search (1536 dimensions)
  embedding: v.optional(v.array(v.float64())),
  // ☝️ Set to optional because we schedule the embedding action,
  // so the embedding field is not available when the deck is created.
};

// eslint-disable-next-line
const deckSchemaObject = v.object(deckSchema);
export type DeckType = Infer<typeof deckSchemaObject>;

/**
 * Type representing a deck returned from queries
 */
export const deckOutSchema = {
  _id: v.id("decks"),
  _creationTime: v.number(),
  ...deckInSchema,
  cardCount: v.number(),
  userId: v.id("users"),
  // We don't need to return the searchableContent or embedding fields
};

// eslint-disable-next-line
const deckOutSchemaObject = v.object(deckOutSchema);
export type DeckOutType = Infer<typeof deckOutSchemaObject>;

/**
 * Deck table schema definition
 */
export const deckTables = {
  decks: defineTable(deckSchema)
    // Index for efficient querying by user
    .index("by_user_id", ["userId"])
    // Full-text search index
    .searchIndex("search_all", {
      searchField: "searchableContent",
      filterFields: ["userId"],
    })
    // Vector index for similarity search
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536, // OpenAI embedding dimensions
      filterFields: ["userId"],
    }),
};
