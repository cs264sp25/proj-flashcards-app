/******************************************************************************
 * SCHEMA
 *
 * Defines types and database schema for messages:
 * - MessageRole: Enum for message roles
 * - MessageAudioType: Fields for audio of a message
 * - MessageInType: Fields for creating messages (content, chatId)
 * - MessageUpdateType: Fields that can be updated (content)
 * - MessageType: Complete message document type including system fields
 * - MessageOutType: Client-facing message type
 * - Uses shared MessageRole enum from shared schema
 * - Includes database indexes for efficient querying (by_chat_id)
 ******************************************************************************/

import { defineTable } from "convex/server";
import { Infer, v } from "convex/values";

/**
 * Type representing the role of a message
 */
export const MessageRole = v.union(v.literal("user"), v.literal("assistant"));
export type MessageRoleType = Infer<typeof MessageRole>;

/**
 * Type representing the audio of a message
 */
export const messageAudioSchema = {
  audioStorageId: v.optional(v.id("_storage")), // audio of the content, if any
  audioUrl: v.optional(v.string()), // playable URL for the audio, if any
};

// eslint-disable-next-line
const messageAudioSchemaObject = v.object(messageAudioSchema);
export type MessageAudioType = Infer<typeof messageAudioSchemaObject>;

/**
 * Type representing the fields that can be provided when creating a message
 */
export const messageInSchema = {
  content: v.string(),
  chatId: v.id("chats"),
};

// eslint-disable-next-line
const messageInSchemaObject = v.object(messageInSchema);
export type MessageInType = Infer<typeof messageInSchemaObject>;

/**
 * Type representing the fields that can be provided when updating a message
 */
export const messageUpdateSchema = {
  content: v.optional(v.string()),
  ...messageAudioSchema,
};

// eslint-disable-next-line
const messageUpdateSchemaObject = v.object(messageUpdateSchema);
export type MessageUpdateType = Infer<typeof messageUpdateSchemaObject>;

/**
 * Type representing a message in the database
 */
export const messageSchema = {
  // Convex will automatically add `_id` and `_creationTime` fields to the schema
  ...messageInSchema,
  role: MessageRole,
  openaiMessageId: v.optional(v.string()), // Managed internally, can be 'pending' until the message is created
  ...messageAudioSchema,
};

// eslint-disable-next-line
const messageSchemaObject = v.object(messageSchema);
export type MessageType = Infer<typeof messageSchemaObject>;

/**
 * Type representing a message as returned to the client
 */
export const messageOutSchema = {
  _id: v.id("messages"),
  _creationTime: v.number(),
  ...messageSchema,
  ...messageAudioSchema,
  // We don't need to return the openaiMessageId field
};

// eslint-disable-next-line
const messageOutSchemaObject = v.object(messageOutSchema);
export type MessageOutType = Infer<typeof messageOutSchemaObject>;

/**
 * Message table schema definition
 */
export const messageTables = {
  messages: defineTable(messageSchema)
    // Index for efficient querying messages by chatId
    .index("by_chat_id", ["chatId"]),
};
