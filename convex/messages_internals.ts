/******************************************************************************
 * INTERNALS
 *
 * Internal operations not exposed to clients:
 * - Used by other operations like seeding and AI actions
 * - Bypasses auth/authorization for internal use
 ******************************************************************************/

import { v } from "convex/values";
import { PaginationResult, paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";
import {
  MutationCtx,
  QueryCtx,
  internalMutation,
  internalQuery,
} from "./_generated/server";

import { PaginationOptsType, SortOrder, SortOrderType } from "./shared";
import {
  getAllMessages as getAllMessagesHelper,
  getMessageById as getMessageByIdHelper,
  createMessage as createMessageHelper,
  updateMessage as updateMessageHelper,
  removeAllMessagesInChat as removeAllMessagesInChatHelper,
  getSubsequentMessages as getSubsequentMessagesHelper,
} from "./messages_helpers";
import {
  messageAudioSchema,
  MessageInType,
  MessageOutType,
  MessageRoleType,
} from "./messages_schema";
import { adjustMessageCount } from "./chats_helpers";

/**
 * Get all messages for a chat.
 */
export const getAllMessages = internalQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    sortOrder: v.optional(SortOrder),
    chatId: v.id("chats"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      sortOrder?: SortOrderType;
      chatId: Id<"chats">;
    },
  ): Promise<PaginationResult<MessageOutType>> => {
    return await getAllMessagesHelper(
      ctx,
      args.paginationOpts,
      args.chatId,
      args.sortOrder,
    );
  },
});

/**
 * Get a message by its ID.
 */
export const getMessageById = internalQuery({
  args: { messageId: v.id("messages") },
  handler: async (ctx: QueryCtx, args: { messageId: Id<"messages"> }) => {
    return await getMessageByIdHelper(ctx, args.messageId);
  },
});

/**
 * Create a new message and adjust the message count.
 *
 * An internal mutation wrapper around the createMessage helper function, with
 * additional message count adjustment. Used when we want to create a message in
 * a different context (ctx) like in seeding Actions.
 */
export const createMessageAndAdjustMessageCount = internalMutation({
  args: {
    role: v.union(v.literal("user"), v.literal("assistant")),
    message: v.object({
      content: v.string(),
      chatId: v.id("chats"),
    }),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      role: MessageRoleType;
      message: MessageInType;
    },
  ) => {
    const messageId = await createMessageHelper(ctx, args.role, args.message);
    await adjustMessageCount(ctx, args.message.chatId, 1);
    return messageId;
  },
});

/**
 * Get subsequent messages from a given message.
 *
 * An internal query wrapper around the getSubsequentMessages helper function.
 * Used when we want to get subsequent messages from a given message in a
 * different context (ctx) like in HTTP Actions. We want to get the subsequent
 * messages from the original message, so we can delete them if the user edits
 * the original message because the conversation history has changed.
 */
export const getSubsequentMessages = internalQuery({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      messageId: Id<"messages">;
    },
  ) => {
    const originalMessage = await getMessageByIdHelper(ctx, args.messageId);
    const subsequentMessages = await getSubsequentMessagesHelper(
      ctx,
      originalMessage.chatId,
      originalMessage._creationTime,
    );
    return subsequentMessages;
  },
});

/**
 * Delete all messages in a chat. An internal mutation wrapper around the
 * removeAllMessagesInChat helper function, with additional message count
 * adjustment. Used when we want to delete messages in a different context (ctx)
 * like in seeding Actions.
 */
export const deleteMessagesAndAdjustMessageCount = internalMutation({
  args: {
    chatId: v.id("chats"),
    afterThisCreationTime: v.optional(v.number()),
    beforeThisCreationTime: v.optional(v.number()),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      chatId: Id<"chats">;
      afterThisCreationTime?: number;
      beforeThisCreationTime?: number;
    },
  ) => {
    const numMessagesDeleted = await removeAllMessagesInChatHelper(
      ctx,
      args.chatId,
      args.afterThisCreationTime,
      args.beforeThisCreationTime,
    );
    await adjustMessageCount(ctx, args.chatId, -numMessagesDeleted);
    return numMessagesDeleted;
  },
});

/**
 * Delete specific messages by their IDs. Used after editing a message in
 * an Assistants API chat to clean up the outdated subsequent messages.
 */
export const deleteMessagesByIdsAndAdjustMessageCount = internalMutation({
  args: {
    messageIds: v.array(v.id("messages")),
    chatId: v.id("chats"), // Needed for count adjustment
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      messageIds: Id<"messages">[];
      chatId: Id<"chats">;
    },
  ) => {
    // Check if there are any IDs to delete to avoid unnecessary operations
    if (args.messageIds.length === 0) {
      return 0;
    }

    // Delete messages concurrently
    await Promise.all(args.messageIds.map((id) => ctx.db.delete(id)));

    // Adjust message count
    const numDeleted = args.messageIds.length;
    await adjustMessageCount(ctx, args.chatId, -numDeleted);

    return numDeleted;
  },
});

/**
 * Update a message with the given content. Used for streaming responses from
 * the AI chatbot to incrementally update the message content.
 */
export const updateMessageContent = internalMutation({
  args: { messageId: v.id("messages"), content: v.string() },
  handler: async (
    ctx: MutationCtx,
    args: {
      messageId: Id<"messages">;
      content: string;
    },
  ) => {
    await updateMessageHelper(ctx, args.messageId, {
      content: args.content,
      // Reset audioStorageId and audioUrl to undefined
      audioStorageId: undefined,
      audioUrl: undefined,
    });
  },
});

// Internal mutation to update the OpenAI message ID
export const updateOpenAIMessageId = internalMutation({
  args: {
    messageId: v.id("messages"),
    openaiMessageId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      openaiMessageId: args.openaiMessageId,
    });
  },
});

// Internal mutation to update the audio of a message
export const updateMessageAudio = internalMutation({
  args: { messageId: v.id("messages"), ...messageAudioSchema },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      audioStorageId: args.audioStorageId,
      audioUrl: args.audioUrl,
    });
  },
});
