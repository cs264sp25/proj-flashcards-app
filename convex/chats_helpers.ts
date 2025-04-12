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
 *   - getMessageSamplesForContext: Get a sample of messages from a chat
 ******************************************************************************/

import { IndexRangeBuilder, PaginationResult } from "convex/server";
import { ConvexError } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";
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
    // assistantId: data.assistantId, // TODO: Add the only assistant for now
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

/**
 * Get a sample of messages from a chat.
 *
 * Returns an array of message objects with role and content.
 * The total number of characters in the content of the messages
 * will not exceed the given maxChars.
 */
export async function getMessageSamplesForContext(
  ctx: ActionCtx,
  chatId: Id<"chats">,
  maxChars: number = 10000,
): Promise<{ role: string; content: string }[]> {
  try {
    // Assume getChatById returns an object with messageCount or similar
    const chat = await ctx.runQuery(internal.chats_internals.getChatById, {
      // Adjust if needed
      chatId,
    });
    // Fetch a reasonable number of latest messages, or all if count is low
    const numMessagesToFetch = chat?.messageCount || 100; // Adjust limit as needed

    // Assume getAllMessages takes chatId and pagination opts (fetching latest)
    // You might need to adjust the query/index for fetching latest messages efficiently
    const paginatedMessages = await ctx.runQuery(
      internal.messages_internals.getAllMessages, // Adjust if needed
      {
        chatId,
        paginationOpts: { numItems: numMessagesToFetch, cursor: null }, // Might need sorting/cursor logic for "latest"
      },
    );
    // Assuming page contains message objects with { role: string, content: string }
    // Reverse the page to get chronological order if fetched in reverse
    const messages = paginatedMessages.page.reverse(); // Or adjust query order

    if (!messages || messages.length === 0) return [];

    let accumulatedChars = 0;
    const samples: { role: string; content: string }[] = [];
    // Iterate backwards through messages (most recent first) for sampling
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      // Ensure content is a string, handle potential non-string content types if necessary
      const contentString =
        typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content);
      const messageChars = contentString.length || 0;

      if (accumulatedChars + messageChars > maxChars && samples.length > 0) {
        break; // Stop adding older messages
      }
      // Add message to the beginning of samples to maintain chronological order for the AI
      samples.unshift({ role: message.role, content: contentString });
      accumulatedChars += messageChars;
    }

    return samples; // Return chronologically ordered samples
  } catch (error) {
    console.error(`Error fetching messages for chat ${chatId}:`, error);
    return [];
  }
}
