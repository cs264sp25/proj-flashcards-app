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
import { getMessageById } from "./messages_helpers";

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
        const message = await ctx.runQuery(internal.messages_internals.getMessageById, {
          messageId: args.placeholderMessageId,
        });
        const chat = await ctx.runQuery(internal.chats_internals.getChatById, {
          chatId: message.chatId,
        });
        if (chat.openaiThreadId) {
          // This will create the message in OpenAI and update the message with the OpenAI's message ID
          await ctx.runAction(internal.openai_messages.createMessage, {
            messageId: args.placeholderMessageId,
            openaiThreadId: chat.openaiThreadId,
            content: message.content,
            role: "assistant",
          });
        }
      },
    );
  },
});
