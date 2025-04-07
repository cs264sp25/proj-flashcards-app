/******************************************************************************
 * HELPERS
 *
 * Pure database operations without auth/authorization:
 * - Core CRUD operations:
 *   - getAllChats: Basic chat retrieval with optional filters
 *   - getChatById: Single chat retrieval
 *   - createChat: Basic chat creation
 *   - updateChat: Basic chat update
 *   - deleteChat: Basic chat deletion
 *
 * - Special operations:
 *   - adjustMessageCount: Update message count when messages are added/removed
 *   - deleteChatWithCascade: Handles deletion of chat and its messages
 *   - deleteAllChatsWithCascade: Bulk delete chats with cascade
 ******************************************************************************/

import { IndexRangeBuilder, PaginationResult } from "convex/server";
import { ConvexError } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";

import { PaginationOptsType, SortOrderType } from "./shared";
import { ChatInType, ChatUpdateType } from "./chats_schema";
import { removeAllMessagesInChat } from "./messages_helpers";

/**
 * Get all chats for the given user, optionally sorted by the given order,
 * optionally filtered by a search query.
 */
export async function getAllChats(
  ctx: QueryCtx,
  paginationOpts: PaginationOptsType,
  userId?: Id<"users">,
  sortOrder?: SortOrderType,
  searchQuery?: string,
): Promise<PaginationResult<Doc<"chats">>> {
  sortOrder = sortOrder || "asc";

  let results: PaginationResult<Doc<"chats">>;

  if (searchQuery) {
    results = await ctx.db
      .query("chats")
      .withSearchIndex("search_all", (q) => {
        if (userId) {
          return q
            .search("searchableContent", searchQuery)
            .eq("userId", userId);
        } else {
          return q.search("searchableContent", searchQuery);
        }
      })
      // The order will be the order of the search results
      .paginate(paginationOpts);
  } else {
    results = await ctx.db
      .query("chats")
      .withIndex(
        "by_user_id",
        (
          q: IndexRangeBuilder<Doc<"chats">, ["userId", "_creationTime"], 0>,
        ) => {
          let q1;

          if (userId) {
            q1 = q.eq("userId", userId);
          }

          return q1 || q;
        },
      )
      .order(sortOrder)
      .paginate(paginationOpts);
  }

  return results;
}

/**
 * Get a chat by its ID.
 */
export async function getChatById(
  ctx: QueryCtx,
  chatId: Id<"chats">,
): Promise<Doc<"chats">> {
  const chat = await ctx.db.get(chatId);
  if (!chat) {
    throw new ConvexError({
      message: `Chat ${chatId} not found`,
      code: 404,
    });
  }
  return chat;
}

/**
 * Create a new chat.
 */
export async function createChat(
  ctx: MutationCtx,
  userId: Id<"users">,
  data: ChatInType,
): Promise<Id<"chats">> {
  const title = (data.title || "").trim();
  const description = (data.description || "").trim();
  const tags = data.tags || [];
  const searchableContent = `${title} ${description} ${tags.join(" ").trim()}`;

  // Create a new chat in the database
  const chatId = await ctx.db.insert("chats", {
    ...data,
    title,
    description,
    tags,
    userId,
    messageCount: 0, // Initialize message count
    openaiThreadId: "pending",
    searchableContent,
  });

  // Create a corresponding thread in OpenAI
  await ctx.scheduler.runAfter(0, internal.openai_threads.createThread, {
    chatId,
    metadata: {
      title,
      description,
      _id: chatId,
    },
  });

  return chatId;
}

/**
 * Update a chat with new content.
 */
export async function updateChat(
  ctx: MutationCtx,
  chatId: Id<"chats">,
  data: ChatUpdateType,
): Promise<void> {
  const chat = await getChatById(ctx, chatId);
  const title = (data.title || chat.title || "").trim();
  const description = (data.description || chat.description || "").trim();
  const tags = data.tags || chat.tags || [];
  const searchableContent = `${title} ${description} ${tags.join(" ").trim()}`;

  // Update the chat in the database
  await ctx.db.patch(chatId, {
    ...data,
    title,
    description,
    tags,
    searchableContent,
  });

  // If the chat has an OpenAI thread ID, update the thread metadata
  if (chat.openaiThreadId) {
    await ctx.scheduler.runAfter(0, internal.openai_threads.updateThread, {
      openaiThreadId: chat.openaiThreadId,
      metadata: {
        title,
        description,
        _id: chatId,
      },
    });
  }
}

/**
 * Delete a chat.
 */
export async function deleteChat(
  ctx: MutationCtx,
  chatId: Id<"chats">,
): Promise<void> {
  const chat = await getChatById(ctx, chatId);
  await ctx.db.delete(chat._id);

  // If the chat has an OpenAI thread ID, delete the thread
  if (chat.openaiThreadId) {
    await ctx.scheduler.runAfter(0, internal.openai_threads.deleteThread, {
      openaiThreadId: chat.openaiThreadId,
    });
  }
}

/**
 * Provide a negative delta to decrease the message count, e.g., when deleting
 * message.
 */
export async function adjustMessageCount(
  ctx: MutationCtx,
  chatId: Id<"chats">,
  delta: number,
): Promise<void> {
  const chat = await getChatById(ctx, chatId);
  await ctx.db.patch(chatId, {
    messageCount: chat.messageCount + delta,
  });
}

/**
 * Delete a chat and all its messages.
 */
export async function deleteChatWithCascade(
  ctx: MutationCtx,
  chatId: Id<"chats">,
): Promise<void> {
  await removeAllMessagesInChat(ctx, chatId);
  await deleteChat(ctx, chatId);
}

/**
 * Delete all chats (and their messages) for a given user.
 * Returns the number of chats deleted.
 */
export async function deleteAllChatsWithCascade(
  ctx: MutationCtx,
  userId?: Id<"users">,
): Promise<number> {
  const chats = await ctx.db
    .query("chats")
    .withIndex(
      "by_user_id",
      (q: IndexRangeBuilder<Doc<"chats">, ["userId", "_creationTime"], 0>) => {
        let q1;

        if (userId) {
          q1 = q.eq("userId", userId);
        }

        return q1 || q;
      },
    )
    .collect();

  await Promise.all(chats.map((chat) => deleteChatWithCascade(ctx, chat._id)));

  return chats.length;
}
