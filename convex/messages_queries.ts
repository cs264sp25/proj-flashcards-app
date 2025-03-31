/******************************************************************************
 * QUERIES
 *
 * Responsibility chain:
 * 1. Authentication check (using auth guard)
 * 2. Message ownership verification (using message guard)
 * 3. Data operation (using helpers)
 *
 * Available queries:
 * - getAll: List messages in a chat
 * - getOne: Get single message
 ******************************************************************************/
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, query } from "./_generated/server";

import { PaginationOptsType, SortOrder, SortOrderType } from "./shared";
import { authenticationGuard } from "./users_guards";
import { getAllMessages, getMessageById } from "./messages_helpers";
import { ownershipGuardThroughChat } from "./messages_guards";
import { MessageOutType } from "./messages_schema";

/**
 * Get all messages for a chat.
 * The authenticated user must own the chat, or an error is thrown.
 */
export const getAll = query({
  args: {
    paginationOpts: paginationOptsValidator,
    chatId: v.id("chats"),
    sortOrder: v.optional(SortOrder),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      chatId: Id<"chats">;
      sortOrder?: SortOrderType;
    },
  ): Promise<PaginationResult<MessageOutType>> => {
    const userId = await authenticationGuard(ctx);
    ownershipGuardThroughChat(ctx, userId, args.chatId);
    return await getAllMessages(
      ctx,
      args.paginationOpts,
      args.chatId,
      args.sortOrder,
    );
  },
});

/**
 * Get a single message by ID.
 * The authenticated user must own the chat containing the message, or an error is thrown.
 */
export const getOne = query({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      messageId: Id<"messages">;
    },
  ): Promise<MessageOutType> => {
    const userId = await authenticationGuard(ctx);
    const message = await getMessageById(ctx, args.messageId);
    await ownershipGuardThroughChat(ctx, userId, message.chatId);
    return message;
  },
});
