/******************************************************************************
 * MUTATIONS
 *
 * Responsibility chain:
 * 1. Data validation (convex validates args)
 * 2. Authentication check (using auth guard)
 * 3. Message ownership verification (using message guard)
 * 4. Data operation (using helpers)
 * 5. Related operations (like AI responses)
 *
 * Available mutations:
 * - create: Create new message and trigger AI response
 * - update: Update existing message with special handling
 * - remove: Delete message and update chat count
 ******************************************************************************/
import { ConvexError, v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { MutationCtx, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

import { authenticationGuard } from "./users_guards";
import { ownershipGuardThroughChat } from "./messages_guards";
import {
  createMessage,
  updateMessage,
  deleteMessage,
  getMessageById,
  getAllMessages,
} from "./messages_helpers";
import { adjustMessageCount } from "./chats_helpers";
import {
  MessageInType,
  MessageUpdateType,
  messageInSchema,
  messageUpdateSchema,
} from "./messages_schema";
import { getAssistantById } from "./assistants_helpers";

// The number of messages to send to the AI as context.
const CHAT_HISTORY_LENGTH = 10;

/**
 * Create a new message for the authenticated user.
 * Also triggers an AI response.
 */
export const create = mutation({
  args: { ...messageInSchema },
  handler: async (ctx: MutationCtx, args: MessageInType) => {
    const userId = await authenticationGuard(ctx);
    const chat = await ownershipGuardThroughChat(ctx, userId, args.chatId);
    const userMessageId = await createMessage(ctx, "user", args);
    await adjustMessageCount(ctx, args.chatId, 1);

    // Insert a message with a placeholder body.
    const botMessageId = await createMessage(ctx, "assistant", {
      content: "...",
      chatId: args.chatId,
    });

    await adjustMessageCount(ctx, args.chatId, 1);

    if (chat.openaiThreadId) {
      // Create the user message in OpenAI
      await ctx.scheduler.runAfter(0, internal.openai_messages.createMessage, {
        messageId: userMessageId,
        openaiThreadId: chat.openaiThreadId,
        content: args.content,
        role: "user",
      });

      if (chat.assistantId) {
        // Get the assistant details
        const assistant = await getAssistantById(ctx, chat.assistantId);
        // If the assistant has an OpenAI assistant ID, start a streaming run with the assistant
        if (assistant.openaiAssistantId) {
          // Start a streaming run with the assistant
          ctx.scheduler.runAfter(0, internal.openai_runs.streamRun, {
            openaiThreadId: chat.openaiThreadId,
            openaiAssistantId: assistant.openaiAssistantId,
            placeholderMessageId: botMessageId,
          });
        }
      } else {
        // If we don't have an OpenAI thread ID or assistant ID, use the old completion method

        // Fetch the latest HISTORY_SIZE messages to send as context.
        const paginatedMessages = await getAllMessages(
          ctx,
          {
            numItems: CHAT_HISTORY_LENGTH + 1,
            cursor: null,
          },
          args.chatId,
          "desc",
        );

        const { page: messages } = paginatedMessages;
        // Reverse the list so that it's in chronological order.
        messages.reverse();
        messages.pop(); // dump the placeholder message

        // Schedule an action that calls OpenAI to generate a response and updates the placeholder message.
        ctx.scheduler.runAfter(0, internal.openai_internals.completion, {
          messages: messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          userId,
          placeholderMessageId: botMessageId,
        });
      }
    }

    return { userMessageId, botMessageId };
  },
});

/**
 * Update an existing message.
 * The authenticated user must own the chat containing the message, or an error is thrown.
 * Also triggers a new AI response.
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
    await ownershipGuardThroughChat(ctx, userId, message.chatId);

    if (message.role === "assistant") {
      throw new ConvexError({
        code: 400,
        message: "Cannot update assistant messages",
      });
    }

    await updateMessage(ctx, messageId, data);
    message = await getMessageById(ctx, messageId);

    // Fetch the latest HISTORY_SIZE messages to send as context.
    const paginatedMessages = await getAllMessages(
      ctx,
      {
        numItems: CHAT_HISTORY_LENGTH,
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
    ctx.scheduler.runAfter(0, internal.openai_internals.completion, {
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      userId,
      placeholderMessageId: botMessageId,
    });

    // Schedule an action to delete all messages after the edited one and before the AI response
    ctx.scheduler.runAfter(0, internal.messages_internals.deleteMessages, {
      chatId: message.chatId,
      afterThisCreationTime: message._creationTime,
      beforeThisCreationTime: botMessage._creationTime,
    });

    return true;
  },
});

/**
 * Delete a message.
 * The authenticated user must own the chat containing the message, or an error is thrown.
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
    await ownershipGuardThroughChat(ctx, userId, message.chatId);
    await deleteMessage(ctx, args.messageId);
    await adjustMessageCount(ctx, message.chatId, -1);
    return true;
  },
});
