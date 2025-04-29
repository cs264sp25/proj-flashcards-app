/******************************************************************************
 * INTERNALS
 *
 * Internal operations not exposed to clients:
 * - Used by other operations like seeding and AI actions
 * - Bypasses auth/authorization for internal use
 ******************************************************************************/

import { ConvexError, v } from "convex/values";
import { PaginationResult, paginationOptsValidator } from "convex/server";
import { Doc, Id } from "./_generated/dataModel";
import {
  QueryCtx,
  MutationCtx,
  internalQuery,
  internalMutation,
} from "./_generated/server";

import { PaginationOptsType, SortOrder, SortOrderType } from "./shared";
import {
  getAllChats as getAllChatsHelper,
  createChat as createChatHelper,
  deleteAllChatsWithCascade as deleteAllChatsWithCascadeHelper,
  adjustMessageCount as adjustMessageCountHelper,
} from "./chats_helpers";
import { chatInSchema, ChatInType, ChatOutType } from "./chats_schema";

/**
 * Get all chats for the given user, optionally sorted by the given order
 */
export const getAllChats = internalQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    sortOrder: v.optional(SortOrder),
    userId: v.id("users"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      sortOrder?: SortOrderType;
      userId: Id<"users">;
    },
  ): Promise<PaginationResult<Doc<"chats">>> => {
    return await getAllChatsHelper(
      ctx,
      args.paginationOpts,
      args.userId,
      args.sortOrder,
    );
  },
});

/**
 * Get a chat by its ID.
 */
export const getChatById = internalQuery({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args): Promise<Doc<"chats">> => {
    const chat = await ctx.db.get(args.chatId);
    if (chat === null) {
      throw new ConvexError({
        message: `Chat ${args.chatId} not found`,
        code: 404,
      });
    }
    return chat;
  },
});

/**
 * Get multiple chats by their IDs.
 */
export const getChatsByTheirIds = internalQuery({
  args: {
    ids: v.array(v.id("chats")),
  },
  handler: async (ctx, args): Promise<ChatOutType[]> => {
    const results: ChatOutType[] = [];
    for (const id of args.ids) {
      const chat = await ctx.db.get(id);
      if (chat === null) continue;
      results.push({
        _id: chat._id,
        _creationTime: chat._creationTime,
        title: chat.title,
        description: chat.description,
        tags: chat.tags,
        messageCount: chat.messageCount,
        userId: chat.userId,
        assistantId: chat.assistantId,
      });
    }
    return results;
  },
});

/**
 * Create a new chat. An internal mutation wrapper around the createChat helper
 * function. Used when we want to create a chat in a different context (ctx) like
 * in seeding Actions.
 */
export const createChat = internalMutation({
  args: {
    chat: v.object(chatInSchema),
    userId: v.id("users"),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      chat: ChatInType;
      userId: Id<"users">;
    },
  ): Promise<Id<"chats">> => {
    return await createChatHelper(ctx, args.userId, args.chat);
  },
});

/**
 * Delete all chats (and their messages) for a user. An internal mutation wrapper
 * around the deleteAllChatsWithCascade helper function.
 * Used when we want to delete chats in a different context (ctx) like in
 * seeding Actions.
 */
export const deleteChatsWithCascade = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      userId: Id<"users">;
    },
  ): Promise<number> => {
    return await deleteAllChatsWithCascadeHelper(ctx, args.userId);
  },
});

/**
 * Internal mutation to update the OpenAI thread ID
 */
export const updateOpenAIThreadId = internalMutation({
  args: {
    chatId: v.id("chats"),
    openaiThreadId: v.string(),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      chatId: Id<"chats">;
      openaiThreadId: string;
    },
  ): Promise<void> => {
    await ctx.db.patch(args.chatId, {
      openaiThreadId: args.openaiThreadId,
    });
  },
});

/**
 * Internal mutation to adjust the message count of a chat.
 */
export const adjustMessageCount = internalMutation({
  args: {
    chatId: v.id("chats"),
    delta: v.number(),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      chatId: Id<"chats">;
      delta: number;
    },
  ): Promise<void> => {
    await adjustMessageCountHelper(ctx, args.chatId, args.delta);
  },
});
