/******************************************************************************
 * HELPER FUNCTIONS
 *
 * Helper functions for AI operations:
 * - handleChatCompletionToolCalls: Handles all tool calls from OpenAI
 * - prepareOpenAIMessages: Prepares OpenAI messages from chat history
 * - processOpenAIStream: Processes OpenAI stream and handles tool calls
 * - processToolCallChunks: Processes individual tool call chunks and updates finalToolCalls
 * - handleCompletion: Handles the completion of a chat
 ******************************************************************************/
import { ActionCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

import OpenAI from "openai";

import { MessageType } from "./openai_schema";
import { tools, handleFunctionCall } from "./openai_tools";
import { openai } from "./openai_helpers";

const DEBUG = true;

/**
 * Process all tool calls received from OpenAI
 */
export async function handleChatCompletionToolCalls(
  ctx: ActionCtx,
  toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
  userId: Id<"users">,
) {
  if (DEBUG) {
    console.log("[handleChatCompletionToolCalls]: Handling tool calls:", toolCalls.length);
  }
  const results: {
    tool_call_id: string;
    content: any;
  }[] = [];

  for (const toolCall of toolCalls) {
    if (toolCall.type === "function") {
      if (DEBUG) {
        console.log("[handleChatCompletionToolCalls]: Processing function call:", toolCall.id);
      }
      const result = await handleFunctionCall(ctx, toolCall, userId);
      results.push({
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }

  if (DEBUG) {
    console.log("[handleChatCompletionToolCalls]: Tool call results:", results);
  }
  return results;
}

/**
 * Prepare OpenAI messages from chat history
 */
export function prepareOpenAIMessages(messages: MessageType[]) {
  const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
    messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

  if (DEBUG) {
    console.log("[prepareOpenAIMessages]: Initial messages:", openaiMessages);
  }

  return openaiMessages;
}

/**
 * Process OpenAI stream and handle tool calls
 */
export async function processOpenAIStream(
  openaiStream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
  finalToolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
  onContentChunk: (
    contentChunk: string,
    fullContentSoFar: string,
  ) => Promise<void>,
) {
  if (DEBUG) {
    console.log("[processOpenAIStream]: Processing OpenAI stream");
  }

  let rawChunksAccumulated = "";
  let fullContent = "";

  for await (const chunk of openaiStream) {
    rawChunksAccumulated += chunk.choices[0]?.delta?.content || "";
    const contentChunk = chunk.choices[0]?.delta?.content;
    const toolCallsChunk = chunk.choices[0]?.delta?.tool_calls;

    if (toolCallsChunk) {
      if (DEBUG) {
        console.log("[processOpenAIStream]: Received tool call chunk:", toolCallsChunk);
      }

      processToolCallChunks(toolCallsChunk, finalToolCalls);
    } else if (contentChunk) {
      fullContent += contentChunk || "";
      if (DEBUG) {
        console.log("[processOpenAIStream]: Received content chunk:", contentChunk);
      }
      await onContentChunk(contentChunk, fullContent);
    }
  }

  console.log("[processOpenAIStream]: process OpenAI stream:", {
    rawChunksAccumulated,
    fullContent,
  });

  return { fullContent, hasToolCalls: finalToolCalls.length > 0 };
}

/**
 * Process individual tool call chunks and update finalToolCalls
 */
export function processToolCallChunks(
  toolCallsChunk: any,
  finalToolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
) {
  for (const toolCall of toolCallsChunk) {
    const { index } = toolCall;

    if (!finalToolCalls[index]) {
      finalToolCalls[index] = {
        id: toolCall.id!,
        type: toolCall.type!,
        function: {
          name: toolCall.function!.name!,
          arguments: toolCall.function!.arguments!,
        },
      };
      if (DEBUG) {
        console.log("[processToolCallChunks]: Created new tool call:", finalToolCalls[index]);
      }
    } else {
      if (toolCall.id) finalToolCalls[index].id = toolCall.id;
      if (toolCall.type) finalToolCalls[index].type = toolCall.type;
      if (toolCall.function?.name)
        finalToolCalls[index].function!.name = toolCall.function.name;
      if (toolCall.function?.arguments) {
        finalToolCalls[index].function!.arguments =
          (finalToolCalls[index].function!.arguments || "") +
          toolCall.function.arguments;
      }
      if (DEBUG) {
        console.log("[processToolCallChunks]: Updated tool call:", finalToolCalls[index]);
      }
    }
  }
}

/**
 * Main completion handler function that processes steps
 */
export async function handleCompletion(
  ctx: ActionCtx,
  userId: Id<"users">,
  messages: MessageType[],
  onContentChunk: (
    contentChunk: string,
    fullContentSoFar: string,
  ) => Promise<void>,
  onError: (error: string) => Promise<void>,
  onDone: () => Promise<void>,
  maxSteps: number = 5,
) {
  if (DEBUG) {
    console.log("[handleCompletion]: Function called with:", {
      userId,
      messages,
      onContentChunk,
      onError,
      onDone,
      maxSteps,
    });
  }
  // Prepare OpenAI messages
  const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
    prepareOpenAIMessages(messages);

  let finalToolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] =
    [];
  let step = 1;

  while (step <= maxSteps) {
    if (DEBUG) {
      console.log("[handleCompletion]: Starting step", step, "of", maxSteps);
    }
    step++;

    const openaiStream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openaiMessages,
      tools: tools,
      tool_choice: "auto",
      stream: true,
      stream_options: {
        include_usage: true,
      },
    });

    if (DEBUG) {
      console.log("[handleCompletion]: Received OpenAI stream");
    }

    const { hasToolCalls } = await processOpenAIStream(
      openaiStream,
      finalToolCalls,
      onContentChunk,
    );

    if (hasToolCalls) {
      if (DEBUG) {
        console.log("[handleCompletion]: Processing tool calls:", finalToolCalls);
      }

      // Add the assistant message with tool calls
      openaiMessages.push({
        role: "assistant",
        content: null,
        tool_calls: finalToolCalls,
      });

      // Process tool calls
      const results = await handleChatCompletionToolCalls(
        ctx,
        finalToolCalls,
        userId,
      );

      if (DEBUG) {
        console.log("[handleCompletion]: Tool call results:", results);
      }

      // Add tool results
      for (const result of results) {
        openaiMessages.push({
          role: "tool",
          content: JSON.stringify(result.content, null, 2),
          tool_call_id: result.tool_call_id,
        });
      }

      if (DEBUG) {
        console.log(
          "[handleCompletion]: Updated messages with tool results:",
          openaiMessages,
        );
      }

      // Reset for next iteration
      finalToolCalls = [];
    } else {
      // If we have no tool calls, we're done
      if (DEBUG) {
        console.log("[handleCompletion]: No tool calls, sending completion marker");
      }

      await onDone();
      return;
    }
  }

  if (DEBUG) {
    console.log("[handleCompletion]: Reached maximum steps");
  }
  await onError("Maximum steps reached");
}
