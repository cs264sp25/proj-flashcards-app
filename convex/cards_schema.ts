/******************************************************************************
 * SCHEMA
 *
 * Defines types and database schema for cards:
 * - CardInType: Fields for creating/updating cards
 * - CardUpdateType: Fields that can be updated
 * - CardType: Complete card document type
 * - CardOutType: Client-facing card type
 *
 * Database Indexes:
 * - by_deck_id: Efficient querying of cards by deck
 * - search_all: Full-text search index on searchableContent
 * - by_embedding: Vector similarity search index
 ******************************************************************************/

import { defineTable } from "convex/server";
import { Infer, v } from "convex/values";

/**
 * Type representing the fields that can be provided when creating a card
 */
export const cardInSchema = {
  front: v.string(),
  back: v.string(),
};

// eslint-disable-next-line
const cardInSchemaObject = v.object(cardInSchema);
export type CardInType = Infer<typeof cardInSchemaObject>;

/**
 * Type representing the fields that can be provided when updating a card
 */
export const cardUpdateSchema = {
  front: v.optional(v.string()),
  back: v.optional(v.string()),
  deckId: v.optional(v.id("decks")),
};

// eslint-disable-next-line
const cardUpdateSchemaObject = v.object(cardUpdateSchema);
export type CardUpdateType = Infer<typeof cardUpdateSchemaObject>;

/**
 * Type representing a card in the database
 */
export const cardSchema = {
  // Convex will automatically add `_id` and `_creationTime` fields to the schema
  ...cardInSchema,
  deckId: v.id("decks"),
  userId: v.id("users"), // denormalized field for efficient querying by user
  // Combined field for full-text search
  searchableContent: v.string(),
  // Vector embedding for similarity search (1536 dimensions)
  embedding: v.optional(v.array(v.float64())),
  // ☝️ Set to optional because we schedule the embedding action,
  // so the embedding field is not available when the card is created.
};

// eslint-disable-next-line
const cardSchemaObject = v.object(cardSchema);
export type CardType = Infer<typeof cardSchemaObject>;

/**
 * Type representing a card as returned to the client
 */
export const cardOutSchema = {
  _id: v.id("cards"),
  _creationTime: v.number(),
  ...cardInSchema,
  deckId: v.id("decks"),
  userId: v.id("users"),
  // We don't need to return the searchableContent or embedding fields
};

// eslint-disable-next-line
const cardOutSchemaObject = v.object(cardOutSchema);
export type CardOutType = Infer<typeof cardOutSchemaObject>;

/**
 * Card table schema definition
 */
export const cardTables = {
  cards: defineTable(cardSchema)
    // Index for efficient querying by deck
    .index("by_deck_id", ["deckId"])
    // Index for efficient querying by user
    .index("by_user_id", ["userId"])
    // Full-text search index
    .searchIndex("search_all", {
      searchField: "searchableContent",
      filterFields: ["deckId"],
    })
    // Vector index for similarity search
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536, // OpenAI embedding dimensions
      filterFields: ["userId"],
    }),
};
