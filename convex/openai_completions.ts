/******************************************************************************
 * OPENAI COMPLETIONS
 *
 * Handles streaming AI responses using OpenAI's API.
 ******************************************************************************/

import { internalAction, ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";

import { chat } from "./prompts";
import { completionArgsSchemaObject } from "./openai_schema";
import { handleCompletion } from "./openai_completions_helpers";

const DEBUG = true;

/**
 * Handles streaming AI responses using OpenAI's API.
 * Updates the message content incrementally as the response streams in.
 */
export const completion = internalAction({
  args: completionArgsSchemaObject,
  handler: async (ctx: ActionCtx, args) => {
    if (DEBUG) {
      console.log("[completion]: Starting completion action");
    }

    await handleCompletion(
      ctx,
      args.userId,
      // messages
      [
        {
          role: "system",
          content: chat.system,
        },
        ...args.messages,
      ],
      // onContentChunk
      async (chunk: string, fullContentSoFar: string) => {
        await ctx.runMutation(internal.messages_internals.updateMessage, {
          messageId: args.placeholderMessageId,
          content: fullContentSoFar,
        });
      },
      //onError
      async (error: string) => {
        console.error(error);
        throw new Error(error); // Propagate the error to the caller
      },
      //onDone
      async () => {
        console.log("[completion]: Completion action done");
      },
    );
  },
});
