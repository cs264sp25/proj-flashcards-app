/******************************************************************************
 * MESSAGE MODULE
 *
 * This module handles message management following a clear separation of
 * responsibilities pattern.
 *
 * Design Patterns:
 *
 * 1. Separation of Concerns:
 *    Client Request
 *    └─► Mutation/Query (auth + chat ownership + orchestration)
 *        └─► Chat Guards (access control)
 *            └─► Helpers (pure database operations)
 *
 * 2. Data Integrity:
 *    - Maintains chat message counts
 *    - Atomic operations where possible
 *    - Proper validation at schema level
 *    - Handles message cleanup during edits
 *
 * 3. Access Control:
 *    - Authentication always checked first
 *    - Chat ownership verified (messages inherit chat's ownership)
 *    - No direct message ownership (controlled via chat ownership)
 *
 * 4. AI Integration:
 *    - Streaming responses with incremental updates
 *    - Proper error handling
 *    - Asynchronous processing via scheduler
 *    - Context-aware responses using message history
 ******************************************************************************/
import {
  defineTable,
  PaginationResult,
  IndexRangeBuilder,
  paginationOptsValidator,
} from "convex/server";
import { ConvexError, Infer, v } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
  internalAction,
  QueryCtx,
  MutationCtx,
  ActionCtx,
} from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

import {
  SortOrder,
  type PaginationOptsType,
  type SortOrderType,
} from "./shared";
import { authenticationGuard } from "./users";
import { adjustMessageCount, getChatById } from "./chats";
import { ownershipGuard as chatOwnershipCheck } from "./chats";

/******************************************************************************
 * SCHEMA
 *
 * Defines types and database schema for messages:
 * - MessageInType: Fields for creating messages (content, chatId)
 * - MessageUpdateType: Fields that can be updated (content)
 * - MessageType: Complete message document type including system fields
 * - Uses shared MessageRole enum from shared schema
 * - Includes database indexes for efficient querying (by_chat_id)
 ******************************************************************************/

/**
 * Type representing the role of a message
 */
export const MessageRole = v.union(v.literal("user"), v.literal("assistant"));
export type MessageRoleType = Infer<typeof MessageRole>;

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
};

// eslint-disable-next-line
const messageUpdateSchemaObject = v.object(messageUpdateSchema);
export type MessageUpdateType = Infer<typeof messageUpdateSchemaObject>;

/**
 * Type representing a message in the database
 */
export const messageSchema = {
  ...messageInSchema,
  role: MessageRole,
  // Convex will automatically add `_id` and `_creationTime` fields to the schema
};

// eslint-disable-next-line
const messageSchemaObject = v.object(messageSchema);
export type MessageType = Infer<typeof messageSchemaObject>;

/**
 * Message table schema definition
 */
export const messageTables = {
  messages: defineTable(messageSchema).index("by_chat_id", ["chatId"]),
};

/******************************************************************************
 * HELPERS
 *
 * Pure database operations without auth/authorization checks:
 * - Core operations:
 *   - getAllMessages: Get messages for a chat with optional sorting and pagination
 *   - getMessageById: Single message retrieval
 *   - createMessage: Basic message creation
 *   - updateMessage: Basic message update
 *   - deleteMessage: Basic message deletion
 * - Special operations:
 *   - removeAllMessagesInChat: Bulk delete messages in a chat
 ******************************************************************************/

export async function getAllMessages(
  ctx: QueryCtx,
  paginationOpts: PaginationOptsType,
  chatId: Id<"chats">,
  sortOrder?: SortOrderType,
  afterThisCreationTime?: number,
  beforeThisCreationTime?: number,
) {
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

export async function getMessageById(ctx: QueryCtx, messageId: Id<"messages">) {
  const message = await ctx.db.get(messageId);
  if (!message) {
    throw new ConvexError({
      message: `Message ${messageId} not found`,
      code: 404,
    });
  }
  return message;
}

// Does not update the message count of the chat.
export async function createMessage(
  ctx: MutationCtx,
  role: MessageRoleType,
  data: MessageInType,
) {
  return await ctx.db.insert("messages", { role, ...data });
}

// Does not update the role of a message.
export async function updateMessage(
  ctx: MutationCtx,
  messageId: Id<"messages">,
  data: MessageUpdateType,
) {
  await ctx.db.patch(messageId, data);
}

// Does not update the message count of the chat.
export async function deleteMessage(
  ctx: MutationCtx,
  messageId: Id<"messages">,
) {
  await ctx.db.delete(messageId);
}

// Returns the number of messages deleted.
// Does not update the message count of the chat.
export async function removeAllMessagesInChat(
  ctx: MutationCtx,
  chatId: Id<"chats">,
  afterThisCreationTime?: number,
  beforeThisCreationTime?: number,
) {
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

/******************************************************************************
 * QUERIES
 *
 * Responsibility chain:
 * 1. Authentication check (using auth guard)
 * 2. Chat ownership verification (using chat guard)
 * 3. Data operation (using helpers)
 *
 * Available queries:
 * - getAll: List messages in a chat
 * - getOne: Get single message
 ******************************************************************************/

/**
 * Get all messages for the authenticated user, optionally sorted by the given order
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
  ) => {
    const { chatId, sortOrder } = args;
    const userId = await authenticationGuard(ctx);
    const chat = await getChatById(ctx, chatId);
    chatOwnershipCheck(userId, chat.userId);
    return await getAllMessages(ctx, args.paginationOpts, chatId, sortOrder);
  },
});

/**
 * Get a single message by ID.
 * The authenticated user must own the message, or an error is thrown.
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
  ) => {
    const userId = await authenticationGuard(ctx);
    const message = await getMessageById(ctx, args.messageId);
    const chat = await getChatById(ctx, message.chatId);
    chatOwnershipCheck(userId, chat.userId);
    return message;
  },
});

/******************************************************************************
 * MUTATIONS
 *
 * Responsibility chain:
 * 1. Data validation (convex validates args)
 * 2. Authentication check (using auth guard)
 * 3. Chat ownership verification (using chat guard)
 * 4. Data operation (using helpers)
 *
 * Available mutations:
 * - create: Creates new message and triggers AI response
 *   - Creates user message
 *   - Updates chat message count
 *   - Creates placeholder AI message
 *   - Schedules AI response action
 * - update: Updates existing message with special handling
 *   - Only allows updating user messages
 *   - Triggers new AI response for edited messages
 *   - Cleans up intermediate messages
 * - remove: Deletes message and updates chat count
 ******************************************************************************/

/**
 * Create a new message for the authenticated user.
 */
export const create = mutation({
  args: { ...messageInSchema },
  handler: async (ctx: MutationCtx, args: MessageInType) => {
    const userId = await authenticationGuard(ctx);
    const chat = await getChatById(ctx, args.chatId);
    chatOwnershipCheck(userId, chat.userId);
    const userMessageId = await createMessage(ctx, "user", args);
    await adjustMessageCount(ctx, args.chatId, 1);

    // Fetch the latest n messages to send as context.
    const paginatedMessages = await getAllMessages(
      ctx,
      {
        numItems: 10,
        cursor: null,
      },
      args.chatId,
      "desc",
    );

    const { page: messages } = paginatedMessages;
    // Reverse the list so that it's in chronological order.
    messages.reverse();

    // Insert a message with a placeholder body.
    const botMessageId = await createMessage(ctx, "assistant", {
      content: "...",
      chatId: args.chatId,
    });

    await adjustMessageCount(ctx, args.chatId, 1);

    // Schedule an action that calls ChatGPT and updates the message.
    ctx.scheduler.runAfter(0, internal.messages.completion, {
      messages,
      messageId: botMessageId,
    });

    return { userMessageId, botMessageId };
  },
});

/**
 * Update an existing message.
 * The authenticated user must own the message, or an error is thrown.
 */
export const update = mutation({
  args: {
    messageId: v.id("messages"),
    ...messageUpdateSchema,
  },
  handler: async (
    ctx: MutationCtx,
    args: MessageUpdateType & {
      messageId: Id<"messages">;
    },
  ) => {
    const { messageId, ...data } = args;
    const userId = await authenticationGuard(ctx);
    let message = await getMessageById(ctx, messageId);
    const chat = await getChatById(ctx, message.chatId);
    chatOwnershipCheck(userId, chat.userId);

    if (message.role === "assistant") {
      throw new ConvexError({
        code: 400,
        message: "Cannot update assistant messages",
      });
    }

    await updateMessage(ctx, messageId, data);
    message = await getMessageById(ctx, messageId);

    // Fetch the latest n messages to send as context.
    const paginatedMessages = await getAllMessages(
      ctx,
      {
        numItems: 10,
        cursor: null,
      },
      message.chatId,
      "desc",
      undefined,
      message._creationTime,
    );

    let { page: messages } = paginatedMessages;
    // Reverse the list so that it's in chronological order.
    messages.reverse();

    messages = [...messages, message];

    // Insert a message with a placeholder body.
    const botMessageId = await createMessage(ctx, "assistant", {
      content: "...",
      chatId: message.chatId,
    });

    const botMessage = await getMessageById(ctx, botMessageId);

    await adjustMessageCount(ctx, message.chatId, 1);

    // Schedule an action that calls ChatGPT and updates the message.
    ctx.scheduler.runAfter(
      0,

      internal.messages.completion,
      {
        messages,
        messageId: botMessageId,
      },
    );

    // Schedule an action to delete all messages after the edited one and before the AI response
    ctx.scheduler.runAfter(
      0,

      internal.messages.deleteMessagesInternal,
      {
        chatId: message.chatId,
        afterThisCreationTime: message._creationTime,
        beforeThisCreationTime: botMessage._creationTime,
      },
    );

    return true;
  },
});

/**
 * Delete a message.
 * The authenticated user must own the message, or an error is thrown.
 */
export const remove = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      messageId: Id<"messages">;
    },
  ) => {
    const userId = await authenticationGuard(ctx);
    const message = await getMessageById(ctx, args.messageId);
    const chat = await getChatById(ctx, message.chatId);
    chatOwnershipCheck(userId, chat.userId);
    await deleteMessage(ctx, args.messageId);
    await adjustMessageCount(ctx, message.chatId, -1);
    return true;
  },
});

/******************************************************************************
 * AI
 *
 * AI integration functionality using OpenAI:
 * - respond: Internal action that handles streaming AI responses
 * - Uses OpenAI's GPT-4 model
 * - Implements streaming with incremental message updates
 * - Integrates with @ai-sdk/openai for API interactions
 ******************************************************************************/

type ChatParams = {
  messages: Doc<"messages">[];
  messageId: Id<"messages">;
};

export const completion = internalAction({
  handler: async (ctx: ActionCtx, args: ChatParams) => {
    const result = streamText({
      model: openai("gpt-4o"),
      messages: args.messages,
    });

    let fullResponse = "";
    for await (const delta of result.textStream) {
      fullResponse += delta;
      await ctx.runMutation(internal.messages.updateMessageInternal, {
        messageId: args.messageId,
        content: fullResponse,
      });
    }
  },
});

/******************************************************************************
 * INTERNALS
 *
 * Internal operations not exposed to clients:
 * - Handles message count synchronization with chats
 * - Available operations:
 *   - createMessage: Creates message and updates chat count
 *   - updateMessage: Updates message content (for AI streaming)
 *   - deleteMessages: Bulk delete with chat count update
 ******************************************************************************/

/**
 * Create a new message for the given user. An internal mutation wrapper around
 * the createMessage helper function, with additional message count adjustment.
 * Used when we want to create a message in a different context (ctx) like in
 * seeding Actions.
 */
export const createMessageInternal = internalMutation({
  args: {
    role: MessageRole,
    message: v.object(messageInSchema),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      role: MessageRoleType;
      message: MessageInType;
    },
  ) => {
    const messageId = await createMessage(ctx, args.role, args.message);
    await adjustMessageCount(ctx, args.message.chatId, 1);
    return messageId;
  },
});

/**
 * Update a message with the given content. Used for streaming responses from
 * the AI chatbot.
 */
export const updateMessageInternal = internalMutation({
  args: { messageId: v.id("messages"), content: v.string() },
  handler: async (
    ctx: MutationCtx,
    args: {
      messageId: Id<"messages">;
      content: string;
    },
  ) => {
    await updateMessage(ctx, args.messageId, { content: args.content });
  },
});

/**
 * Delete all messages in a chat. An internal mutation wrapper around the
 * removeAllMessagesInChat helper function, with additional message count
 * adjustment. Used when we want to create a card in a different context (ctx)
 * like in seeding Actions.
 */
export const deleteMessagesInternal = internalMutation({
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
    const numMessagesDeleted = await removeAllMessagesInChat(
      ctx,
      args.chatId,
      args.afterThisCreationTime,
      args.beforeThisCreationTime,
    );
    await adjustMessageCount(ctx, args.chatId, -numMessagesDeleted);
    return numMessagesDeleted;
  },
});

/******************************************************************************
 * SEED
 *
 * Testing and development data generation:
 * - Creates sample user/assistant message pairs
 * - Maintains proper chat message counts
 ******************************************************************************/

/**
 * Create sample messages for a chat.
 * numberOfMessages is optional and defaults to 5.
 * If clearExistingData is true, deletes all existing messages in the chat.
 */
export const createSampleMessages = internalAction({
  args: {
    chatId: v.id("chats"),
    numberOfMessages: v.optional(v.number()),
    clearExistingData: v.optional(v.boolean()),
  },
  handler: async (
    ctx: ActionCtx,
    args: {
      chatId: Id<"chats">;
      numberOfMessages?: number;
      clearExistingData?: boolean;
    },
  ) => {
    const chatId = args.chatId;
    const numberOfMessages = args.numberOfMessages || 5;
    const clearExistingData = args.clearExistingData || false;
    const messageIds: Id<"messages">[] = [];

    if (clearExistingData) {
      await ctx.runMutation(internal.messages.deleteMessagesInternal, {
        chatId,
      });
    }

    for (let i = 0; i < numberOfMessages; i++) {
      const messageId = await ctx.runMutation(
        internal.messages.createMessageInternal,
        {
          role: i % 2 === 0 ? "user" : "assistant",
          message: {
            content: `Message ${i + 1} content`,
            chatId,
          },
        },
      );

      messageIds.push(messageId as Id<"messages">);
    }

    return messageIds;
  },
});
