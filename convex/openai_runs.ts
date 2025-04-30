/******************************************************************************
 * OPENAI RUNS
 *
 * Actions for creating streaming runs in OpenAI.
 ******************************************************************************/

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

import { handleRun } from "./openai_runs_helpers";

const DEBUG = true;

// Internal action to stream a run in OpenAI
export const run = internalAction({
  args: {
    openaiThreadId: v.string(),
    openaiAssistantId: v.string(),
    placeholderMessageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      // Debouncing variables
      let lastUpdateTime = 0;
      let lastUpdateLength = 0;
      const MIN_UPDATE_INTERVAL = 500; // ms
      const MIN_CONTENT_CHANGE = 20; // characters
      let fullResponse = "";
      let updatePending = false;

      // Function to perform the actual update
      const performUpdate = async (content: string) => {
        if (updatePending) return; // Prevent concurrent updates

        updatePending = true;
        try {
          await ctx.runMutation(
            internal.messages_internals.updateMessageContent,
            {
              messageId: args.placeholderMessageId,
              content: content,
            },
          );

          lastUpdateTime = Date.now();
          lastUpdateLength = content.length;

          if (DEBUG) {
            console.log(
              "[run]: Database updated with content length:",
              content.length,
            );
          }
        } catch (error) {
          console.error("[run]: Error updating message:", error);
        } finally {
          updatePending = false;
        }
      };

      await handleRun(
        ctx,
        args.openaiThreadId,
        args.openaiAssistantId,
        args.userId,
        // onContentChunk
        async (contentChunk: string, fullContentSoFar: string) => {
          // Update fullResponse with the latest snapshot
          fullResponse = fullContentSoFar;

          // Apply the combined debouncing approach
          const now = Date.now();
          const contentChange = fullResponse.length - lastUpdateLength;

          // Update the database if:
          // 1. It's been at least MIN_UPDATE_INTERVAL ms since the last update AND there's new content
          // 2. OR there's been a significant amount of new content added
          if (
            (now - lastUpdateTime > MIN_UPDATE_INTERVAL && contentChange > 0) ||
            contentChange > MIN_CONTENT_CHANGE
          ) {
            // Use our debounced update function instead
            await performUpdate(fullResponse);
          }
        },
        // onError
        async (error: string) => {
          // Update the placeholder message with an error message
          await ctx.runMutation(
            internal.messages_internals.updateMessageContent,
            {
              messageId: args.placeholderMessageId,
              content: "An error occurred while generating a response.",
            },
          );
        },
        // onDone
        async () => {
          // At this point, fullResponse contains the final response
          // We could update the placeholder message here, but we'll do that in the
          // onMessageDone function instead
        },
        // onMessageDone
        async (messageId: string, messageContent: string) => {
          // messageContent should be the same as fullResponse
          await ctx.runMutation(
            internal.messages_internals.updateMessageContent,
            {
              messageId: args.placeholderMessageId,
              content: messageContent,
            },
          );
          // Update the placeholder message with the OpenAI message ID
          await ctx.runMutation(
            internal.messages_internals.updateOpenAIMessageId,
            {
              messageId: args.placeholderMessageId,
              openaiMessageId: messageId,
            },
          );
        },
      );
      return { success: true };
    } catch (error) {
      console.error("[run]: Error in streaming run:", error);

      // Update the placeholder message with an error message
      await ctx.runMutation(internal.messages_internals.updateMessageContent, {
        messageId: args.placeholderMessageId,
        content: "An error occurred while generating a response.",
      });

      throw error;
    }
  },
});
