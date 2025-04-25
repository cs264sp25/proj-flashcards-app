/******************************************************************************
 * OPENAI THREADS
 *
 * Actions for creating, updating, and deleting threads in OpenAI.
 ******************************************************************************/

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { openai } from "./openai_helpers";

// Internal action to create a thread in OpenAI
export const createThread = internalAction({
  args: {
    chatId: v.id("chats"),
    metadata: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    try {
      // Create the thread in OpenAI
      const thread = await openai.beta.threads.create({
        metadata: args.metadata,
      });

      // Update our database with the OpenAI thread ID
      await ctx.runMutation(internal.chats_internals.updateOpenAIThreadId, {
        chatId: args.chatId,
        openaiThreadId: thread.id,
      });

      return thread.id;
    } catch (error) {
      console.error("Error creating thread in OpenAI:", error);
      throw error;
    }
  },
});

// Internal action to update a thread in OpenAI
export const updateThread = internalAction({
  args: {
    openaiThreadId: v.string(),
    metadata: v.record(v.string(), v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Update the thread in OpenAI
      await openai.beta.threads.update(args.openaiThreadId, {
        metadata: args.metadata,
      });

      return true;
    } catch (error) {
      console.error("Error updating thread in OpenAI:", error);
      throw error;
    }
  },
});

// Internal action to delete a thread in OpenAI
export const deleteThread = internalAction({
  args: {
    openaiThreadId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Delete the thread in OpenAI
      await openai.beta.threads.del(args.openaiThreadId);

      return true;
    } catch (error) {
      console.error("Error deleting thread in OpenAI:", error);
      throw error;
    }
  },
});
