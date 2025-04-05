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
  createMessage as createMessageHelper,
  updateMessage as updateMessageHelper,
  removeAllMessagesInChat as removeAllMessagesInChatHelper,
} from "./messages_helpers";
import {
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
 * Create a new message. An internal mutation wrapper around the createMessage helper
 * function, with additional message count adjustment.
 * Used when we want to create a message in a different context (ctx) like in
 * seeding Actions.
 */
export const createMessage = internalMutation({
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
 * Update a message with the given content. Used for streaming responses from
 * the AI chatbot.
 */
export const updateMessage = internalMutation({
  args: { messageId: v.id("messages"), content: v.string() },
  handler: async (
    ctx: MutationCtx,
    args: {
      messageId: Id<"messages">;
      content: string;
    },
  ) => {
    await updateMessageHelper(ctx, args.messageId, { content: args.content });
  },
});

/**
 * Delete all messages in a chat. An internal mutation wrapper around the
 * removeAllMessagesInChat helper function, with additional message count
 * adjustment. Used when we want to delete messages in a different context (ctx)
 * like in seeding Actions.
 */
export const deleteMessages = internalMutation({
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
