/******************************************************************************
 * OPENAI RUNS
 *
 * Actions for creating streaming runs in OpenAI.
 ******************************************************************************/

import OpenAI from "openai";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

import {
  Text,
  Message,
  MessageDelta,
  ImageFile,
  TextDelta,
} from "openai/resources/beta/threads/messages.mjs";
import { AssistantStreamEvent } from "openai/resources/beta/assistants.mjs";
import { RunStepDelta } from "openai/resources/beta/threads/runs/steps.mjs";
import { RunStep } from "openai/resources/beta/threads/runs/steps.mjs";

const DEBUG = false;

// Internal action to stream a run in OpenAI
export const streamRun = internalAction({
  args: {
    openaiThreadId: v.string(),
    openaiAssistantId: v.string(),
    placeholderMessageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    try {
      // Instantiate the OpenAI API client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Create a streaming run
      const run = openai.beta.threads.runs.stream(args.openaiThreadId, {
        assistant_id: args.openaiAssistantId,
      });

      const aggregatedText: string[] = [];

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
          await ctx.runMutation(internal.messages_internals.updateMessage, {
            messageId: args.placeholderMessageId,
            content: content,
          });

          lastUpdateTime = Date.now();
          lastUpdateLength = content.length;

          if (DEBUG) {
            console.log(
              "Database updated with content length:",
              content.length,
            );
          }
        } catch (error) {
          console.error("Error updating message:", error);
        } finally {
          updatePending = false;
        }
      };

      // Set up event handlers for the streaming run
      run
        .on("event", (event: AssistantStreamEvent) => {
          // This allows you to subscribe to all the possible raw events sent by the OpenAI streaming API.
          // See: https://platform.openai.com/docs/api-reference/assistants-streaming/events
          // In many cases it will be more convenient to subscribe to a more specific set of events for your use case.
          if (DEBUG) {
            console.log("event", event);
            // Look at `event.event` for the type of event
            // Look at `event.data` for the data object associated with the event
          }
        })
        .on("runStepCreated", (runStep: RunStep) => {
          // A new run step is being created
          if (DEBUG) {
            console.log("Run step created", runStep);
          }
        })
        .on("runStepDelta", (delta: RunStepDelta, snapshot: RunStep) => {
          // A new run step delta is being created
          if (DEBUG) {
            console.log("Run step delta created", delta, snapshot);
          }
        })
        .on("runStepDone", (runStep: RunStep) => {
          // A run step is done being created
          if (DEBUG) {
            console.log("Run step done", runStep);
          }
        })
        .on("messageCreated", (message: Message) => {
          // A new message is being created
          if (DEBUG) {
            console.log("Message created", message);
          }
        })
        .on("messageDelta", (delta: MessageDelta, snapshot: Message) => {
          // Message content is being streamed
          if (DEBUG) {
            console.log("Message delta created", delta, snapshot);
          }
        })
        .on("messageDone", (message: Message) => {
          // A message is done being created
          if (DEBUG) {
            console.log("Message done", message);
          }

          // Update the OpenAI message ID in our database
          ctx.runMutation(internal.messages_internals.updateOpenAIMessageId, {
            messageId: args.placeholderMessageId,
            openaiMessageId: message.id,
          });
        })
        .on("textCreated", (text: Text) => {
          // A new text message is being created
          if (DEBUG) {
            console.log("Assistant message created", text);
          }
        })
        .on("textDelta", async (textDelta: TextDelta, snapshot: Text) => {
          // Text content is being streamed
          if (DEBUG) {
            console.log("textDelta", textDelta, snapshot);
            aggregatedText.push(snapshot.value);
          }

          // Update fullResponse with the latest snapshot
          fullResponse = snapshot.value;

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
            // Keep your commented code for reference
            // await ctx.runMutation(internal.messages.update, {
            //   messageId: args.placeholderMessageId,
            //   content: responseSoFar,
            // });

            // Use our debounced update function instead
            await performUpdate(fullResponse);
          }
        })
        .on("textDone", async (content: Text, snapshot: Message) => {
          // The text message is complete
          if (DEBUG) {
            console.log("textDone", content, snapshot);

            console.log("Text done! Here are the aggregated text deltas:");
            let index = 0;
            for (const message of aggregatedText) {
              console.log("message", { index, message });
              index++;
            }
          }

          // Final update with the complete content
          await performUpdate(content.value);

          // Update the placeholder message with the ID of the OpenAI message
          // await ctx.runMutation(internal.messages.updateOpenAIMessageId, {
          //   messageId: args.placeholderMessageId,
          //   openaiMessageId: snapshot.id,
          // });
        })
        .on("imageFileDone", (content: ImageFile, snapshot: Message) => {
          // An image file is done being created
          if (DEBUG) {
            console.log("imageFileDone", content, snapshot);
          }
        })
        .on("toolCallCreated", (toolCall) => {
          // A tool call is being created (e.g., code interpreter)
          if (DEBUG) {
            console.log("toolCallCreated", toolCall);
          }
        })
        .on("toolCallDelta", (toolCallDelta, snapshot) => {
          // Tool call content is being streamed
          if (DEBUG) {
            console.log("toolCallDelta", toolCallDelta, snapshot);
          }
        })
        .on("error", async (error) => {
          // An error occurred in the streaming run
          if (DEBUG) {
            console.error("Error in streaming run:", error);
          }

          // Update the placeholder message with an error message
          // await ctx.runMutation(internal.messages.update, {
          //   messageId: args.placeholderMessageId,
          //   content: "An error occurred while generating a response.",
          // });

          // Use our update function instead
          await performUpdate("An error occurred while generating a response.");
        })
        .on("end", async () => {
          if (DEBUG) {
            console.log("Streaming run completed");
          }
        });

      // Wait for the run to complete
      await run.finalRun();

      return { success: true };
    } catch (error) {
      console.error("Error in streaming run:", error);

      // Update the placeholder message with an error message
      await ctx.runMutation(internal.messages_internals.updateMessage, {
        messageId: args.placeholderMessageId,
        content: "An error occurred while generating a response.",
      });

      throw error;
    }
  },
});
