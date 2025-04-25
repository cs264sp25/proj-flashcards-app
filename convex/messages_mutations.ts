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
import { Doc, Id } from "./_generated/dataModel";
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
  getSubsequentMessages,
} from "./messages_helpers";
import { adjustMessageCount } from "./chats_helpers";
import {
  MessageRole,
  MessageInType,
  MessageUpdateType,
  messageInSchema,
  messageUpdateSchema,
  MessageRoleType,
} from "./messages_schema";
import { getAssistantById } from "./assistants_helpers";
import { getChatById } from "./chats_helpers";

const DEBUG = true;

// The number of messages to send to the AI as context.
const CHAT_HISTORY_LENGTH = 10;

/**
 * Create a new message for the authenticated user.
 * Also triggers an AI response.
 */
export const create = mutation({
  args: {
    ...messageInSchema,
    role: v.optional(MessageRole),
  },
  handler: async (
    ctx: MutationCtx,
    args: MessageInType & { role: MessageRoleType },
  ) => {
    const role = args.role || "user";
    const userId = await authenticationGuard(ctx);
    const chat = await ownershipGuardThroughChat(ctx, userId, args.chatId);
    const userMessageId = await createMessage(ctx, role, args);
    await adjustMessageCount(ctx, args.chatId, 1);

    /*
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
        ctx.scheduler.runAfter(0, internal.openai_direct.completion, {
          messages: messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          userId,
          placeholderMessageId: botMessageId,
        });
      }
    }
*/

    if (chat.openaiThreadId && role === "user") {
      // Create the user message in OpenAI
      await ctx.scheduler.runAfter(0, internal.openai_messages.createMessage, {
        messageId: userMessageId,
        openaiThreadId: chat.openaiThreadId,
        content: args.content,
        role,
      });
    }

    return userMessageId;
  },
});

/**
 * Update an existing message.
 * The authenticated user must own the chat containing the message, or an error is thrown.
 * If the chat uses the OpenAI Assistants API, it handles edits by deleting/recreating messages.
 * Otherwise, it triggers a legacy completion.
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

    if (DEBUG) {
      console.log("Updating message", messageId, data);
    }

    const userId = await authenticationGuard(ctx);
    const originalMessage = await getMessageById(ctx, messageId);
    const chat = await getChatById(ctx, originalMessage.chatId);
    await ownershipGuardThroughChat(ctx, userId, originalMessage.chatId);

    if (DEBUG) {
      console.log("Original message", originalMessage);
    }

    if (originalMessage.role === "assistant") {
      throw new ConvexError({
        code: 400,
        message: "Cannot update assistant messages directly",
      });
    }

    let assistant: Doc<"assistants"> | null = null;
    if (chat.assistantId) {
      assistant = await getAssistantById(ctx, chat.assistantId);
    }

    if (chat.openaiThreadId && assistant?.openaiAssistantId) {
      if (DEBUG) {
        console.log("Chat", chat);
        console.log("Assistant", assistant);
      }

      // 1. Update the Convex message content first
      let updatedMessage = originalMessage;
      if (data.content !== originalMessage.content) {
        await updateMessage(ctx, messageId, data);
        updatedMessage = await getMessageById(ctx, messageId);
      }

      if (DEBUG) {
        console.log("Updated message", updatedMessage);
      }

      // 2. Find subsequent messages in Convex DB using the new helper
      const subsequentMessages = await getSubsequentMessages(
        ctx, // Use ctx directly here, helper expects QueryCtx/MutationCtx
        updatedMessage.chatId,
        updatedMessage._creationTime, // Use updated message's time
      );

      if (DEBUG) {
        console.log("Subsequent messages", subsequentMessages);
      }

      // 3. Schedule deletion of original and subsequent OpenAI messages
      // Collect IDs to delete in OpenAI
      const openaiMessageIdsToDelete: string[] = [];
      if (originalMessage.openaiMessageId) {
        openaiMessageIdsToDelete.push(originalMessage.openaiMessageId);
      }
      subsequentMessages.forEach((msg) => {
        if (msg.openaiMessageId) {
          openaiMessageIdsToDelete.push(msg.openaiMessageId);
        }
      });

      // Schedule a *single* action to delete all relevant OpenAI messages
      if (openaiMessageIdsToDelete.length > 0) {
        await ctx.scheduler.runAfter(
          0,
          internal.openai_messages.deleteMessages,
          {
            openaiThreadId: chat.openaiThreadId,
            openaiMessageIds: openaiMessageIdsToDelete,
          },
        );
      }

      if (DEBUG) {
        console.log("Scheduled deletion of OpenAI messages");
      }

      // 4. Schedule creation of the *new* user message in OpenAI thread
      await ctx.scheduler.runAfter(0, internal.openai_messages.createMessage, {
        messageId: updatedMessage._id,
        openaiThreadId: chat.openaiThreadId,
        content: updatedMessage.content,
        role: "user",
      });

      const placeholderMessageId = await createMessage(ctx, "assistant", {
        content: "...",
        chatId: updatedMessage.chatId,
      });

      if (DEBUG) {
        console.log("Placeholder message", placeholderMessageId);
      }

      await adjustMessageCount(ctx, updatedMessage.chatId, 1);

      if (DEBUG) {
        console.log("Scheduling stream run to update the placeholder message");
      }

      await ctx.scheduler.runAfter(0, internal.openai_runs.run, {
        openaiThreadId: chat.openaiThreadId,
        openaiAssistantId: assistant.openaiAssistantId,
        placeholderMessageId: placeholderMessageId,
        userId,
      });

      if (DEBUG) {
        console.log("Schedule deletion of subsequent messages");
      }

      // 7. Schedule deletion of subsequent *Convex* messages using the new internal mutation
      const convexMessageIdsToDelete = subsequentMessages.map((msg) => msg._id);
      if (convexMessageIdsToDelete.length > 0) {
        await ctx.scheduler.runAfter(
          0,
          internal.messages_internals.deleteMessagesByIds,
          {
            messageIds: convexMessageIdsToDelete,
            chatId: updatedMessage.chatId,
          },
        );
      }

      return true;
    } else {
      await updateMessage(ctx, messageId, data);
      const updatedMessage = await getMessageById(ctx, messageId);

      const paginatedMessages = await getAllMessages(
        ctx,
        {
          numItems: CHAT_HISTORY_LENGTH,
          cursor: null,
        },
        updatedMessage.chatId,
        "desc",
        undefined,
        updatedMessage._creationTime,
      );

      let { page: messages } = paginatedMessages;
      messages.reverse();
      messages = [...messages, updatedMessage];

      const placeholderMessageId = await createMessage(ctx, "assistant", {
        content: "...",
        chatId: updatedMessage.chatId,
      });
      await adjustMessageCount(ctx, updatedMessage.chatId, 1);

      const placeholderMessage = await getMessageById(
        ctx,
        placeholderMessageId,
      );

      await ctx.scheduler.runAfter(0, internal.openai_completions.completion, {
        messages: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        userId,
        placeholderMessageId: placeholderMessageId,
      });

      await ctx.scheduler.runAfter(
        0,
        internal.messages_internals.deleteMessages,
        {
          chatId: updatedMessage.chatId,
          afterThisCreationTime: updatedMessage._creationTime,
          beforeThisCreationTime: placeholderMessage._creationTime,
        },
      );

      return true;
    }
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
