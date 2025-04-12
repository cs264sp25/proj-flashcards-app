/******************************************************************************
 * TYPES
 *
 * Type definitions for AI-related operations:
 * - MessageRoleType: Role of the message
 * - MessageType: Type for messages
 * - CompletionArgsType: Parameters for completion
 * - GetEmbeddingsArgsType: Parameters for getEmbeddings
 ******************************************************************************/
import { Infer, v } from "convex/values";

export const messageRoleSchema = v.union(
  v.literal("user"),
  v.literal("assistant"),
  v.literal("system"),
);

export type MessageRoleType = Infer<typeof messageRoleSchema>;

export const messageSchema = {
  role: messageRoleSchema,
  content: v.string(),
};

export const messageSchemaObject = v.object(messageSchema);
export type MessageType = Infer<typeof messageSchemaObject>;

export const completionArgsSchema = {
  messages: v.array(messageSchemaObject),
  userId: v.id("users"),
  placeholderMessageId: v.id("messages"),
};

export const completionArgsSchemaObject = v.object(completionArgsSchema);
export type CompletionArgsType = Infer<typeof completionArgsSchemaObject>;

export const getEmbeddingsArgsSchema = {
  text: v.string(),
  deckId: v.optional(v.id("decks")),
  cardId: v.optional(v.id("cards")),
};

export const getEmbeddingsArgsSchemaObject = v.object(getEmbeddingsArgsSchema);
export type GetEmbeddingsArgsType = Infer<typeof getEmbeddingsArgsSchemaObject>;
