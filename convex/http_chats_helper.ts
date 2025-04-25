/******************************************************************************
 * CHATS HELPER FUNCTIONS
 *
 * Helper functions for chats routes
 ******************************************************************************/

import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { ActionCtx } from "./_generated/server";

import { z } from "zod";

import { MessageType } from "./messages_schema";

const DEBUG = true;

/**
 * Validate request body against schema
 */
export function validateRequestBody(rawRequestBody: Record<string, string>) {
  if (DEBUG) {
    console.log("[validateRequestBody]: Validating request body:", rawRequestBody);
  }

  const completionRequestSchema = z.object({
    messageId: z.string(),
  });

  return completionRequestSchema.safeParse(rawRequestBody);
}

/**
 * Retrieve message and chat history
 */
export async function getMessageAndHistory(
  ctx: ActionCtx,
  messageId: Id<"messages">,
  numMessages: number = 10, // set this to 0 to skip getting chat history
): Promise<{ message: MessageType; messages: MessageType[] }> {
  if (DEBUG) {
    console.log("[getMessageAndHistory]: Getting message and history for message ID:", messageId);
  }

  // Get the message
  const message = await ctx.runQuery(
    internal.messages_internals.getMessageById,
    {
      messageId,
    },
  );

  if (!message) {
    throw new ConvexError({
      code: 404,
      message: "Message not found",
    });
  }

  if (DEBUG) {
    console.log("[getMessageAndHistory]: Found message:", message);
  }

  const messages: MessageType[] = [];

  if (numMessages > 0) {
    // Get chat history
    const paginatedMessages = await ctx.runQuery(
      internal.messages_internals.getAllMessages,
      {
        paginationOpts: {
          numItems: numMessages,
          cursor: null,
        },
        chatId: message.chatId,
        sortOrder: "desc",
      },
    );

    const { page: chatHistory } = paginatedMessages;
    messages.push(...chatHistory.reverse());

    if (DEBUG) {
      console.log("[getMessageAndHistory]: Chat history:", messages);
    }
  }

  return { message, messages };
}
