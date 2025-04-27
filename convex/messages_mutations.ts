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
  getMessageById,
  getAllMessages,
  getSubsequentMessages,
} from "./messages_helpers";
import { adjustMessageCount } from "./chats_helpers";
import {
  MessageInType,
  messageInSchema,
  MessageRoleType,
} from "./messages_schema";
import { getAssistantById } from "./assistants_helpers";
import { getChatById } from "./chats_helpers";

const DEBUG = true;

// The number of messages to send to the AI as context.
const CHAT_HISTORY_LENGTH = 10;

// We use this helper because most of create mutation and part of updateContent mutation are the same
async function createUserMessageAndStreamAIResponse(
  ctx: MutationCtx,
  userId: Id<"users">,
  content: string,
  chat: Doc<"chats">,
) {
  // Store the user message in Convex
  const userMessageId = await createMessage(ctx, "user", {
    content,
    chatId: chat._id,
  });
  await adjustMessageCount(ctx, chat._id, 1);

  if (chat.openaiThreadId) {
    // Create the user message in OpenAI
    // This will update the openaiMessageId field of the userMessageId message
    await ctx.scheduler.runAfter(0, internal.openai_messages.createMessage, {
      messageId: userMessageId,
      openaiThreadId: chat.openaiThreadId,
      content: content,
      role: "user",
    });
  }

  // Insert a message with a placeholder body.
  const botMessageId = await createMessage(ctx, "assistant", {
    content: "...",
    chatId: chat._id,
  });

  await adjustMessageCount(ctx, chat._id, 1);

  // We will update the openaiMessageId field of the botMessageId message later

  let openaiThreadId: string | null = chat.openaiThreadId || null;
  let openaiAssistantId: string | null = null;
  if (chat.assistantId) {
    const assistant = await getAssistantById(ctx, chat.assistantId);
    openaiAssistantId = assistant.openaiAssistantId || null;
  }

  if (openaiThreadId && openaiAssistantId) {
    // Start a streaming run with the assistant
    ctx.scheduler.runAfter(0, internal.openai_runs.run, {
      openaiThreadId,
      openaiAssistantId,
      placeholderMessageId: botMessageId,
      userId,
    });
  } else {
    // Use the good old chat completion method

    // Fetch the latest HISTORY_SIZE messages to send as context.
    const paginatedMessages = await getAllMessages(
      ctx,
      {
        numItems: CHAT_HISTORY_LENGTH + 1,
        cursor: null,
      },
      chat._id,
      "desc",
    );

    const { page: messages } = paginatedMessages;
    // Reverse the list so that it's in chronological order.
    messages.reverse();
    messages.pop(); // dump the placeholder message

    // Schedule an action that calls OpenAI to generate a response and updates the placeholder message.
    ctx.scheduler.runAfter(0, internal.openai_completions.completion, {
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      userId,
      placeholderMessageId: botMessageId,
    });
  }

  return userMessageId;
}

/**
 * Create a new message for the authenticated user.
 * Also triggers an AI response.
 */
export const createUserMessage = mutation({
  args: {
    ...messageInSchema,
  },
  handler: async (
    ctx: MutationCtx,
    args: MessageInType,
  ) => {
    const userId = await authenticationGuard(ctx);
    const chat = await ownershipGuardThroughChat(ctx, userId, args.chatId);

    // Create the user message and stream the AI response
    return createUserMessageAndStreamAIResponse(
      ctx,
      userId,
      args.content,
      chat,
    );
  },
});

/**
 * Update the content of an existing (user) message.
 * Also deletes all subsequent messages and triggers an AI response.
 */
export const updateContent = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      messageId: Id<"messages">;
      content: string;
    },
  ) => {
    if (DEBUG) {
      console.log("Update message mutation called");
    }

    // Destructure the messageId and data
    const { messageId, content } = args;
    if (DEBUG) {
      console.log("Updating message", messageId, content);
    }

    // Get User ID (check authentication)
    const userId = await authenticationGuard(ctx);
    if (DEBUG) {
      console.log("User ID", userId);
    }

    // Get the original message (check if it exists)
    const originalMessage = await getMessageById(ctx, messageId);
    if (DEBUG) {
      console.log("Original message", originalMessage);
    }

    // Refuse to update assistant messages
    if (originalMessage.role === "assistant") {
      throw new ConvexError({
        code: 400,
        message: "Cannot update assistant messages directly",
      });
    }

    // Get the chat and check authorization
    const chat = await getChatById(ctx, originalMessage.chatId);
    await ownershipGuardThroughChat(ctx, userId, originalMessage.chatId);

    // Delete the original message and all subsequent messages
    // This will adjust the message count of the chat, and delete the
    // OpenAI messages associated with the deleted messages
    await deleteMessageAndAllSubsequentMessages(ctx, originalMessage, chat);

    // From this point on, it is the same as the createMessage route
    return createUserMessageAndStreamAIResponse(ctx, userId, content, chat);
  },
});

// Helper function to delete a message and all subsequent messages
// This is used in updateContent and remove mutations
async function deleteMessageAndAllSubsequentMessages(
  ctx: MutationCtx,
  message: Doc<"messages">,
  chat: Doc<"chats">,
) {
  // Find all subsequent messages (after the message we are editing)
  const subsequentMessages = await getSubsequentMessages(
    ctx,
    message.chatId,
    message._creationTime,
  );
  if (DEBUG) {
    console.log("Subsequent messages", subsequentMessages);
  }

  // Schedule deletion of this and all subsequent Convex messages
  const convexMessageIdsToDelete = [
    message._id,
    ...subsequentMessages.map((msg) => msg._id),
  ];
  if (convexMessageIdsToDelete.length > 0) {
    await ctx.scheduler.runAfter(
      0,
      internal.messages_internals.deleteMessagesByIdsAndAdjustMessageCount,
      {
        messageIds: convexMessageIdsToDelete,
        chatId: message.chatId,
      },
    );
  }

  // Schedule deletion of all relevant OpenAI messages
  const openaiMessageIdsToDelete: string[] = [];
  if (message.openaiMessageId) {
    openaiMessageIdsToDelete.push(message.openaiMessageId);
  }
  subsequentMessages.forEach((msg) => {
    if (msg.openaiMessageId) {
      openaiMessageIdsToDelete.push(msg.openaiMessageId);
    }
  });
  if (openaiMessageIdsToDelete.length > 0) {
    await ctx.scheduler.runAfter(0, internal.openai_messages.deleteMessages, {
      openaiThreadId: chat.openaiThreadId as string,
      openaiMessageIds: openaiMessageIdsToDelete,
    });
  }
}

/**
 * Delete a message.
 * Also deletes all subsequent messages because the conversation history is changed.
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
    const chat = await ownershipGuardThroughChat(ctx, userId, message.chatId);
    await deleteMessageAndAllSubsequentMessages(ctx, message, chat);
    return true;
  },
});
