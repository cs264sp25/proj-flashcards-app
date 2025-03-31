/******************************************************************************
 * SEED
 *
 * Testing and development data generation:
 * - Uses internal mutations to bypass auth
 ******************************************************************************/
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// The default number of chats to create.
const NUM_CHATS = 5;
const CLEAR_EXISTING_DATA = false;

/**
 * Create sample chats for a user.
 * numberOfChats is optional and defaults to NUM_CHATS.
 * If clearExistingData is true, deletes all existing chats for the user.
 */
export const createSampleChats = internalAction({
  args: {
    userId: v.id("users"),
    numberOfChats: v.optional(v.number()),
    clearExistingData: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    args: {
      userId: Id<"users">;
      numberOfChats?: number;
      clearExistingData?: boolean;
    },
  ): Promise<Id<"chats">[]> => {
    const userId = args.userId;
    const numberOfChats = args.numberOfChats || NUM_CHATS;
    const clearExistingData = args.clearExistingData || CLEAR_EXISTING_DATA;
    const chatIds: Id<"chats">[] = [];

    if (clearExistingData) {
      await ctx.runMutation(internal.chats_internals.deleteChatsWithCascade, {
        userId: args.userId,
      });
    }

    for (let i = 0; i < numberOfChats; i++) {
      const chatId = await ctx.runMutation(
        internal.chats_internals.createChat,
        {
          userId,
          chat: {
            title: `Chat ${i + 1}`,
            description: `Sample chat ${i + 1} description`,
          },
        },
      );

      chatIds.push(chatId as Id<"chats">);
    }

    return chatIds;
  },
});
