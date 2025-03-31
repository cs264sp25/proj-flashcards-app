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
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { MutationCtx, mutation } from "./_generated/server";

import { authenticationGuard } from "./users_guards";
import { ownershipGuard } from "./chats_guards";
import {
  createChat,
  updateChat,
  deleteChatWithCascade,
  getChatById,
} from "./chats_helpers";
import {
  ChatInType,
  ChatUpdateType,
  chatInSchema,
  chatUpdateSchema,
} from "./chats_schema";

/**
 * Create a new chat for the authenticated user.
 */
export const create = mutation({
  args: { ...chatInSchema },
  handler: async (ctx: MutationCtx, args: ChatInType): Promise<Id<"chats">> => {
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
  ): Promise<boolean> => {
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
  ): Promise<boolean> => {
    const userId = await authenticationGuard(ctx);
    const chat = await getChatById(ctx, args.chatId);
    ownershipGuard(userId, chat.userId);
    await deleteChatWithCascade(ctx, args.chatId);
    return true;
  },
});
