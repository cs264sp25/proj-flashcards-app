/******************************************************************************
 * HELPERS
 *
 * Pure database operations without auth/authorization:
 * - Core operations:
 *   - getAllMessages: Get messages for a chat with optional sorting and pagination
 *   - getMessageById: Single message retrieval
 *   - createMessage: Basic message creation
 *   - updateMessage: Basic message update
 *   - deleteMessage: Basic message deletion
 * - Special operations:
 *   - removeAllMessagesInChat: Bulk delete messages in a chat
 ******************************************************************************/
import { IndexRangeBuilder, PaginationResult } from "convex/server";
import { ConvexError } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx, internalMutation } from "./_generated/server";

import {
  MessageInType,
  MessageOutType,
  MessageUpdateType,
  MessageRoleType,
} from "./messages_schema";
import { PaginationOptsType, SortOrderType } from "./shared";

/**
 * Get all messages for a chat, optionally sorted by the given order,
 * optionally filtered by creation time.
 */
export async function getAllMessages(
  ctx: QueryCtx,
  paginationOpts: PaginationOptsType,
  chatId: Id<"chats">,
  sortOrder?: SortOrderType,
  afterThisCreationTime?: number,
  beforeThisCreationTime?: number,
): Promise<PaginationResult<MessageOutType>> {
  sortOrder = sortOrder || "desc"; // For chat history, we want the most recent messages first.

  const results: PaginationResult<Doc<"messages">> = await ctx.db
    .query("messages")
    .withIndex(
      "by_chat_id",
      (
        q: IndexRangeBuilder<Doc<"messages">, ["chatId", "_creationTime"], 0>,
      ) => {
        /* 
          let q1, q2, q3;

          q1 = q.eq("chatId", chatId);

          if (afterThisCreationTime) {
            q2 = q1.gt("_creationTime", afterThisCreationTime);
          }

          if (beforeThisCreationTime) {
            q3 = q2 ? q2.lt("_creationTime", beforeThisCreationTime) :
              q1.lt("_creationTime", beforeThisCreationTime);
          }

          return q3 || q2 || q1;
        */
        // The above code is equivalent to the following:
        return q
          .eq("chatId", chatId)
          .gt("_creationTime", afterThisCreationTime ?? 0)
          .lt(
            "_creationTime",
            beforeThisCreationTime ?? Number.MAX_SAFE_INTEGER,
          );
      },
    )
    .order(sortOrder)
    .paginate(paginationOpts);

  return {
    ...results,
    page: results.page,
  };
}

/**
 * Get all messages in a chat created after a specified timestamp.
 */
export async function getSubsequentMessages(
  ctx: QueryCtx, // This can be QueryCtx as it only reads
  chatId: Id<"chats">,
  afterThisCreationTime: number,
): Promise<Doc<"messages">[]> { // Return type is an array of Docs
  const messages = await ctx.db
    .query("messages")
    // Use the correct index 'by_chat_id' which includes _creationTime
    .withIndex("by_chat_id", (q) =>
      q
        .eq("chatId", chatId)
        // Ensure we only get messages strictly *after* the given time
        .gt("_creationTime", afterThisCreationTime)
    )
    // Order by creation time ascending to process them chronologically if needed,
    // although for deletion, order might not strictly matter.
    .order("asc")
    .collect();

  return messages;
}

/**
 * Get a message by its ID.
 */
export async function getMessageById(
  ctx: QueryCtx,
  messageId: Id<"messages">,
): Promise<MessageOutType> {
  const message = await ctx.db.get(messageId);
  if (!message) {
    throw new ConvexError({
      message: `Message ${messageId} not found`,
      code: 404,
    });
  }
  return message;
}

/**
 * Create a new message.
 * Does not update the message count of the chat.
 */
export async function createMessage(
  ctx: MutationCtx,
  role: MessageRoleType,
  data: MessageInType,
): Promise<Id<"messages">> {
  return await ctx.db.insert("messages", { role, ...data });
}

/**
 * Update a message.
 * Does not update the role of a message.
 */
export async function updateMessage(
  ctx: MutationCtx,
  messageId: Id<"messages">,
  data: MessageUpdateType,
): Promise<void> {
  await ctx.db.patch(messageId, data);
}

/**
 * Delete a message.
 * Does not update the message count of the chat.
 */
export async function deleteMessage(
  ctx: MutationCtx,
  messageId: Id<"messages">,
): Promise<void> {
  await ctx.db.delete(messageId);
}

/**
 * Delete all messages in a chat.
 * Returns the number of messages deleted.
 * Does not update the message count of the chat.
 */
export async function removeAllMessagesInChat(
  ctx: MutationCtx,
  chatId: Id<"chats">,
  afterThisCreationTime?: number,
  beforeThisCreationTime?: number,
): Promise<number> {
  const messages = await ctx.db
    .query("messages")
    .withIndex("by_chat_id", (q) =>
      q
        .eq("chatId", chatId)
        .gt("_creationTime", afterThisCreationTime ?? 0)
        .lt("_creationTime", beforeThisCreationTime ?? Number.MAX_SAFE_INTEGER),
    )
    .collect();

  await Promise.all(messages.map((message) => deleteMessage(ctx, message._id)));

  return messages.length;
}
