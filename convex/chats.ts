/******************************************************************************
 * CHAT MODULE
 *
 * This module handles chat management following a clear separation of
 * responsibilities pattern.
 *
 * Design Patterns:
 *
 * 1. Separation of Concerns:
 *    Client Request
 *    └─► Mutation/Query (auth + authorization + orchestration)
 *        └─► Guards (access control)
 *            └─► Helpers (pure database operations)
 *
 * 2. Data Integrity:
 *    - Cascading deletes handled at helper level
 *    - Message count maintained through `adjustMessageCount`
 *    - Consistent error handling
 *    - Proper validation at schema level
 *    - Atomic operations where possible
 *
 * 3. Access Control:
 *    - Authentication always checked first
 *    - Authorization follows authentication
 *    - Ownership verified before any operation
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

import {
  SortOrder,
  type PaginationOptsType,
  type SortOrderType,
} from "./shared";
import { authenticationGuard } from "./users";
import { removeAllMessagesInChat } from "./messages";

/******************************************************************************
 * SCHEMA
 *
 * Defines types and database schema for chats:
 * - ChatInType: Fields that can be provided when creating/updating
 * - ChatUpdateType: Fields that can be updated
 * - ChatType: Complete chat document type including system fields
 * - Includes database indexes for efficient querying (by_user_id)
 ******************************************************************************/

/**
 * Type representing the fields that can be provided when creating a chat
 */
export const chatInSchema = {
  title: v.string(),
  description: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
};

// eslint-disable-next-line
const chatInSchemaObject = v.object(chatInSchema);
export type ChatInType = Infer<typeof chatInSchemaObject>;

/**
 * Type representing the fields that can be provided when updating a chat
 */
export const chatUpdateSchema = {
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
};

// eslint-disable-next-line
const chatUpdateSchemaObject = v.object(chatUpdateSchema);
export type ChatUpdateType = Infer<typeof chatUpdateSchemaObject>;

/**
 * Type representing a chat in the database
 */
export const chatSchema = {
  ...chatInSchema,
  messageCount: v.number(),
  userId: v.id("users"),
  // Convex will automatically add `_id` and `_creationTime` fields to the schema
};

// eslint-disable-next-line
const chatSchemaObject = v.object(chatSchema);
export type ChatType = Infer<typeof chatSchemaObject>;

/**
 * Chat table schema definition
 */
export const chatTables = {
  chats: defineTable(chatSchema).index("by_user_id", ["userId"]),
};

/******************************************************************************
 * GUARDS
 *
 * Authorization checks:
 * - ownershipGuard: Verifies chat ownership
 *   - Throws 403 error for unauthorized access
 ******************************************************************************/

/**
 * Check if the chat is owned by the user and throw an error if not.
 */
export const ownershipGuard = (
  userId: Id<"users">,
  chatUserId: Id<"users">,
): void => {
  if (chatUserId !== userId) {
    throw new ConvexError({
      message: "Not authorized to access this chat",
      code: 403,
    });
  }
};

/******************************************************************************
 * HELPERS
 *
 * Pure database operations without auth/authorization checks:
 * - Core CRUD operations:
 *   - getAllChats: Basic chat retrieval with optional filters
 *   - getChatById: Single chat retrieval
 *   - createChat: Basic chat creation
 *   - updateChat: Basic chat update
 *   - deleteChat: Basic chat deletion
 * - Special operations:
 *   - adjustMessageCount: Update message count when messages are added/removed
 *   - deleteChatWithCascade: Handles deletion of chat and its messages
 *   - deleteAllChatsWithCascade: Bulk delete chats with cascade
 ******************************************************************************/

export async function getAllChats(
  ctx: QueryCtx,
  paginationOpts: PaginationOptsType,
  userId?: Id<"users">,
  sortOrder?: SortOrderType,
) {
  sortOrder = sortOrder || "asc";

  const results: PaginationResult<Doc<"chats">> = await ctx.db
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
    .order(sortOrder)
    .paginate(paginationOpts);

  return {
    ...results,
    page: results.page, // This is the data (records) for the current page; we can transform it if needed
  };
}

export async function getChatById(ctx: QueryCtx, chatId: Id<"chats">) {
  const chat = await ctx.db.get(chatId);
  if (!chat) {
    throw new ConvexError({
      message: `Chat ${chatId} not found`,
      code: 404,
    });
  }
  return chat;
}

export async function createChat(
  ctx: MutationCtx,
  userId: Id<"users">,
  data: ChatInType,
) {
  return await ctx.db.insert("chats", {
    ...data,
    userId,
    messageCount: 0, // Initialize message count
  });
}

export async function updateChat(
  ctx: MutationCtx,
  chatId: Id<"chats">,
  data: Partial<ChatInType>,
) {
  await ctx.db.patch(chatId, data);
}

export async function deleteChat(ctx: MutationCtx, chatId: Id<"chats">) {
  await ctx.db.delete(chatId);
}

// Provide a negative delta to decrease the message count, e.g., when deleting
// message.
export async function adjustMessageCount(
  ctx: MutationCtx,
  chatId: Id<"chats">,
  delta: number,
) {
  const chat = await getChatById(ctx, chatId);
  await ctx.db.patch(chatId, {
    messageCount: chat.messageCount + delta,
  });
}

export async function deleteChatWithCascade(
  ctx: MutationCtx,
  chatId: Id<"chats">,
) {
  await removeAllMessagesInChat(ctx, chatId);
  await deleteChat(ctx, chatId);
}

// Can be used to delete all chats for a user or all chats in the system.
// TODO: This function is not efficient for large datasets. It should be
// changed to batch delete chats over scheduled actions.
export async function deleteAllChatsWithCascade(
  ctx: MutationCtx,
  userId?: Id<"users">,
) {
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

  await Promise.all(
    chats.map((message) => deleteChatWithCascade(ctx, message._id)),
  );

  return chats.length;
}

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

/**
 * Get all chats for the authenticated user, optionally sorted by the given order
 */
export const getAll = query({
  args: {
    paginationOpts: paginationOptsValidator,
    sortOrder: v.optional(SortOrder),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      sortOrder?: SortOrderType;
    },
  ) => {
    const userId = await authenticationGuard(ctx);
    return await getAllChats(ctx, args.paginationOpts, userId, args.sortOrder);
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
  ) => {
    const userId = await authenticationGuard(ctx);
    const chat = await getChatById(ctx, args.chatId);
    ownershipGuard(userId, chat.userId);
    return chat;
  },
});

/******************************************************************************
 * MUTATIONS
 *
 * Responsibility chain:
 * 1. Data validation (convex validates args)
 * 2. Authentication check (using auth guard)
 * 3. Authorization check (using chat guard)
 * 4. Data operation (using helpers)
 * 5. Related operations (like cascade deletes)
 *
 * Available mutations:
 * - create: Create new chat
 * - update: Update existing chat
 * - remove: Delete chat
 ******************************************************************************/

/**
 * Create a new chat for the authenticated user.
 */
export const create = mutation({
  args: { ...chatInSchema },
  handler: async (ctx: MutationCtx, args: ChatInType) => {
    const userId = await authenticationGuard(ctx);
    return await createChat(ctx, userId, args);
  },
});

/**
 * Update an existing chat.
 * The authenticated user must own the chat, or an error is thrown.
 */
export const update = mutation({
  args: {
    chatId: v.id("chats"),
    ...chatUpdateSchema,
  },
  handler: async (
    ctx: MutationCtx,
    args: ChatUpdateType & {
      chatId: Id<"chats">;
    },
  ) => {
    const { chatId, ...data } = args;
    const userId = await authenticationGuard(ctx);
    const chat = await getChatById(ctx, chatId);
    ownershipGuard(userId, chat.userId);
    await updateChat(ctx, chatId, data);
    return true;
  },
});

/**
 * Delete a chat (and its messages) given its ID.
 * The authenticated user must own the chat, or an error is thrown.
 */
export const remove = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      chatId: Id<"chats">;
    },
  ) => {
    const userId = await authenticationGuard(ctx);
    const chat = await getChatById(ctx, args.chatId);
    ownershipGuard(userId, chat.userId);
    await deleteChatWithCascade(ctx, args.chatId);
    return true;
  },
});

/******************************************************************************
 * INTERNALS
 *
 * Internal operations not exposed to clients:
 * - Used by seeding and system operations
 * - Bypasses auth/authorization for internal use
 ******************************************************************************/

/**
 * Create a new chat for the given user.
 * An internal mutation wrapper around the createChat helper.
 * Used when we want to create a chat in a different context (ctx) like in Actions.
 */
export const createChatInternal = internalMutation({
  args: {
    userId: v.id("users"),
    chat: v.object(chatInSchema),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      userId: Id<"users">;
      chat: ChatInType;
    },
  ) => {
    return await createChat(ctx, args.userId, args.chat);
  },
});

/**
 * Delete all chats (and their messages) for the given user.
 * An internal mutation wrapper around the deleteAllChatsWithCascade helper.
 * Used when we want to delete chats in a different context (ctx) like in seeding Actions.
 */
export const deleteChatsWithCascadeInternal = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      userId: Id<"users">;
    },
  ) => {
    await deleteAllChatsWithCascade(ctx, args.userId);
  },
});

/******************************************************************************
 * SEED
 *
 * Testing and development data generation:
 * - Uses internal mutations to bypass auth
 ******************************************************************************/

/**
 * Create sample chats for a user.
 * numberOfChats is optional and defaults to 5.
 * If clearExistingData is true, deletes all existing chats for the user.
 */
export const createSampleChats = internalAction({
  args: {
    userId: v.id("users"),
    numberOfChats: v.optional(v.number()),
    clearExistingData: v.optional(v.boolean()),
  },
  handler: async (
    ctx: ActionCtx,
    args: {
      userId: Id<"users">;
      numberOfChats?: number;
      clearExistingData?: boolean;
    },
  ) => {
    const userId = args.userId;
    const numberOfChats = args.numberOfChats || 5;
    const clearExistingData = args.clearExistingData || false;
    const chatIds: Id<"chats">[] = [];

    if (clearExistingData) {
      await ctx.runMutation(internal.chats.deleteChatsWithCascadeInternal, {
        userId: args.userId,
      });
    }

    for (let i = 0; i < numberOfChats; i++) {
      const chatId = await ctx.runMutation(internal.chats.createChatInternal, {
        userId,
        chat: {
          title: `Chat ${i + 1}`,
          description: `Sample chat ${i + 1} description`,
        },
      });

      chatIds.push(chatId as Id<"chats">);
    }

    return chatIds;
  },
});
