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
import { internal } from "./_generated/api";

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
 * Also schedules the creation of the corresponding OpenAI thread.
 */
export const create = mutation({
  args: { ...chatInSchema },
  handler: async (ctx: MutationCtx, args: ChatInType): Promise<Id<"chats">> => {
    const userId = await authenticationGuard(ctx);
    const chatId = await createChat(ctx, userId, args);

    const title = (args.title || "").trim();
    const description = (args.description || "").trim();
    await ctx.scheduler.runAfter(0, internal.openai_threads.createThread, {
      chatId,
      metadata: {
        title,
        description,
        _id: chatId,
      },
    });

    return chatId;
  },
});

/**
 * Update an existing chat.
 * The authenticated user must own the chat, or an error is thrown.
 * Also schedules the update of the corresponding OpenAI thread metadata.
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

    const title = (data.title || chat.title || "").trim();
    const description = (data.description || chat.description || "").trim();
    if (chat.openaiThreadId && chat.openaiThreadId !== "pending") {
      await ctx.scheduler.runAfter(0, internal.openai_threads.updateThread, {
        openaiThreadId: chat.openaiThreadId,
        metadata: {
          title,
          description,
          _id: chatId,
        },
      });
    }

    return true;
  },
});

/**
 * Delete a chat (and its messages) given its ID.
 * The authenticated user must own the chat, or an error is thrown.
 * Also schedules the deletion of the corresponding OpenAI thread.
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

    if (chat.openaiThreadId && chat.openaiThreadId !== "pending") {
      await ctx.scheduler.runAfter(0, internal.openai_threads.deleteThread, {
        openaiThreadId: chat.openaiThreadId,
      });
    }

    await deleteChatWithCascade(ctx, args.chatId);
    return true;
  },
});
