/******************************************************************************
 * OPENAI MESSAGES
 *
 * Actions for creating messages in OpenAI.
 ******************************************************************************/

import { ActionCtx, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { MessageRoleType } from "./messages_schema";
import { openai } from "./openai_helpers";

// Internal action to create a message in OpenAI
export const createMessage = internalAction({
  args: {
    messageId: v.id("messages"),
    openaiThreadId: v.string(),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
  },
  handler: async (
    ctx: ActionCtx,
    args: {
      messageId: Id<"messages">;
      openaiThreadId: string;
      content: string;
      role: MessageRoleType;
    },
  ): Promise<string> => {
    try {
      // Create the message in OpenAI
      const message = await openai.beta.threads.messages.create(
        args.openaiThreadId,
        {
          role: args.role,
          content: args.content,
        },
      );

      // Update our database with the OpenAI message ID
      await ctx.runMutation(internal.messages_internals.updateOpenAIMessageId, {
        messageId: args.messageId,
        openaiMessageId: message.id,
      });

      return message.id;
    } catch (error) {
      console.error("Error creating message in OpenAI:", error);
      throw error;
    }
  },
});

// Internal action to delete a message from an OpenAI thread
export const deleteMessage = internalAction({
  args: {
    openaiMessageId: v.string(),
    openaiThreadId: v.string(),
  },
  handler: async (
    ctx: ActionCtx,
    args: {
      openaiMessageId: string;
      openaiThreadId: string;
    },
  ): Promise<boolean> => {
    try {
      const response = await openai.beta.threads.messages.del(
        args.openaiThreadId,
        args.openaiMessageId,
      );

      return response.deleted;
    } catch (error) {
      console.error("Error deleting message in OpenAI:", error);
      throw error;
    }
  },
});

// Internal action to delete multiple messages from an OpenAI thread
export const deleteMessages = internalAction({
  args: {
    openaiMessageIds: v.array(v.string()),
    openaiThreadId: v.string(),
  },
  handler: async (
    ctx: ActionCtx,
    args: {
      openaiMessageIds: string[];
      openaiThreadId: string;
    },
  ): Promise<boolean[]> => {
    // Return an array of deletion statuses
    try {
      // Perform deletions concurrently
      const deletionPromises = args.openaiMessageIds.map((messageId) =>
        openai.beta.threads.messages
          .del(args.openaiThreadId, messageId)
          .then((response) => response.deleted)
          .catch((error) => {
            console.error(
              `Error deleting OpenAI message ${messageId} in thread ${args.openaiThreadId}:`,
              error,
            );
            return false; // Indicate failure for this specific message
          }),
      );

      const results = await Promise.all(deletionPromises);
      return results;
    } catch (error) {
      // Catch broader errors (e.g., OpenAI client init)
      console.error("Error during bulk OpenAI message deletion:", error);
      // Return an array of false matching the input length to indicate failure
      return args.openaiMessageIds.map(() => false);
    }
  },
});
