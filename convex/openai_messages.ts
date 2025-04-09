/******************************************************************************
 * OPENAI MESSAGES
 *
 * Actions for creating messages in OpenAI.
 ******************************************************************************/

import OpenAI from "openai";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Internal action to create a message in OpenAI
export const createMessage = internalAction({
  args: {
    messageId: v.id("messages"),
    openaiThreadId: v.string(),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
  },
  handler: async (ctx, args) => {
    try {
      // Instantiate the OpenAI API client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

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
