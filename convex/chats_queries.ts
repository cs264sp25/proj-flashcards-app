/******************************************************************************
 * QUERIES
 *
 * Responsibility chain:
 * 1. Authentication check (using auth guard)
 * 2. Authorization check (using chat guard)
 * 3. Data operation (using helpers)
 *
 * Available queries:
 * - getAll: List user's chats
 * - getOne: Get single chat
 ******************************************************************************/
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, query } from "./_generated/server";

import { PaginationOptsType, SortOrder, SortOrderType } from "./shared";
import { authenticationGuard } from "./users_guards";
import { getAllChats, getChatById } from "./chats_helpers";
import { ownershipGuard } from "./chats_guards";
import { ChatOutType } from "./chats_schema";

/**
 * Get all chats for the authenticated user, optionally sorted by the given order.
 * The authenticated user must own the chats, or an error is thrown.
 */
export const getAll = query({
  args: {
    paginationOpts: paginationOptsValidator,
    sortOrder: v.optional(SortOrder),
    searchQuery: v.optional(v.string()),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      sortOrder?: SortOrderType;
      searchQuery?: string;
    },
  ): Promise<PaginationResult<ChatOutType>> => {
    const userId = await authenticationGuard(ctx);
    return await getAllChats(
      ctx,
      args.paginationOpts,
      userId,
      args.sortOrder,
      args.searchQuery,
    );
  },
});

/**
 * Get a single chat by ID.
 * The authenticated user must own the chat, or an error is thrown.
 */
export const getOne = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      chatId: Id<"chats">;
    },
  ): Promise<ChatOutType> => {
    const userId = await authenticationGuard(ctx);
    const chat = await getChatById(ctx, args.chatId);
    ownershipGuard(userId, chat.userId);
    return chat;
  },
});
