/******************************************************************************
 * SEED
 *
 * Testing and development data generation:
 * - Creates sample user/assistant message pairs
 * - Maintains proper chat message counts
 ******************************************************************************/
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// The default number of messages to create.
const NUM_MESSAGES = 5;
const CLEAR_EXISTING_DATA = false;

/**
 * Create sample messages for a chat.
 * numberOfMessages is optional and defaults to NUM_MESSAGES.
 * If clearExistingData is true, deletes all existing messages in the chat.
 */
export const createSampleMessages = internalAction({
  args: {
    chatId: v.id("chats"),
    numberOfMessages: v.optional(v.number()),
    clearExistingData: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    args: {
      chatId: Id<"chats">;
      numberOfMessages?: number;
      clearExistingData?: boolean;
    },
  ) => {
    const chatId = args.chatId;
    const numberOfMessages = args.numberOfMessages || NUM_MESSAGES;
    const clearExistingData = args.clearExistingData || CLEAR_EXISTING_DATA;
    const messageIds: Id<"messages">[] = [];

    if (clearExistingData) {
      await ctx.runMutation(internal.messages_internals.deleteMessagesAndAdjustMessageCount, {
        chatId,
      });
    }

    for (let i = 0; i < numberOfMessages; i++) {
      const messageId = await ctx.runMutation(
        internal.messages_internals.createMessageAndAdjustMessageCount,
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
