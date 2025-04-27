/******************************************************************************
 * HELPER FUNCTIONS
 *
 * Helper functions for AI operations:
 * - prepareForRun: Prepares for a run
 * - handleRunStreamToolCalls: Handles streaming tool calls
 * - handleRun: Handles a run
 ******************************************************************************/
import { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

import OpenAI from "openai";

import { MessageType as MessageTypeFromMessagesSchema } from "./messages_schema";
import { handleFunctionCall, tools } from "./openai_tools";
import { openai } from "./openai_helpers";
import { chat as chatPrompt } from "./prompts";

const DEBUG = true;

/**
 * Prepare for a Run
 * Given a message, returns openaiThreadId and openaiAssistantId
 */
export async function prepareForRun(
  ctx: ActionCtx,
  message: MessageTypeFromMessagesSchema,
) {
  const openaiThreadId = null;
  const openaiAssistantId = null;

  // Get the chat
  const chat = await ctx.runQuery(internal.chats_internals.getChatById, {
    chatId: message.chatId,
  });

  if (!chat) {
    if (DEBUG) {
      console.log("[prepareForRun]: Chat not found");
    }
    return {
      error: "Chat not found",
      openaiThreadId: null,
      openaiAssistantId: null,
    };
  }

  // Check if we have the required OpenAI IDs
  if (!chat.openaiThreadId || !chat.assistantId) {
    if (DEBUG) {
      console.log(
        "[prepareForRun]: Missing OpenAI IDs, falling back to direct completion",
      );
    }
    return {
      error: "Missing OpenAI IDs",
      openaiThreadId: null,
      openaiAssistantId: null,
    };
  }

  // Get the assistant
  const assistant = await ctx.runQuery(
    internal.assistants_internals.getAssistantById,
    {
      assistantId: chat.assistantId,
    },
  );

  if (!assistant) {
    return {
      error: "Assistant not found",
      openaiThreadId: null,
      openaiAssistantId: null,
    };
  }

  if (!assistant.openaiAssistantId) {
    if (DEBUG) {
      console.log(
        "[prepareForRun]: Missing OpenAI assistant ID, falling back to direct completion",
      );
    }
    return {
      error: "Missing OpenAI assistant ID",
      openaiThreadId: null,
      openaiAssistantId: null,
    };
  }

  if (DEBUG) {
    console.log("[prepareForRun]: OpenAI thread ID:", openaiThreadId);
    console.log("[prepareForRun]: OpenAI assistant ID:", openaiAssistantId);
  }

  return { openaiThreadId, openaiAssistantId };
}

/**
 * Handles streaming tool calls
 */
export async function handleRunStreamToolCalls(
  ctx: ActionCtx,
  toolCalls: OpenAI.Beta.Threads.Runs.RequiredActionFunctionToolCall[],
  userId: Id<"users">,
): Promise<OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[]> {
  if (DEBUG) {
    console.log("[handleRunStreamToolCalls]: Handling run stream tool calls:", toolCalls);
  }
  const toolOutputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[] =
    [];
  for (const toolCall of toolCalls) {
    const result = await handleFunctionCall(ctx, toolCall, userId);

    toolOutputs.push({
      tool_call_id: toolCall.id,
      output: JSON.stringify(result),
    });
  }

  return toolOutputs;
}

/**
 * Processes stream content deltas and calls the appropriate callbacks
 */
async function processStreamContent(
  event: { event: string; data: any },
  fullContent: string,
  onContentChunk: (chunk: string, fullContent: string) => Promise<void>,
  onDone: () => Promise<void>,
  onError: (error: string) => Promise<void>,
  onMessageDone?: (messageId: string, messageContent: string) => Promise<void>,
): Promise<{ fullContent: string; shouldReturn: boolean }> {
  let updatedContent = fullContent;
  let shouldReturn = false;

  if (event.event === "thread.message.delta") {
    if (event.data.delta.content) {
      for (const content of event.data.delta.content) {
        if (content.type === "text" && content.text?.value) {
          updatedContent += content.text.value;
          await onContentChunk(content.text.value, updatedContent);
        }
      }
    }
  } else if (event.event === "thread.message.completed") {
    if (onMessageDone) {
      await onMessageDone(event.data.id, event.data.content[0].text.value);
    }
  } else if (event.event === "thread.run.completed") {
    await onDone();
    shouldReturn = true;
  } else if (event.event === "thread.run.failed") {
    await onError(event.data.last_error?.message || "Unknown error");
    shouldReturn = true;
  }

  return { fullContent: updatedContent, shouldReturn };
}

/**
 * Handles a run
 */
export async function handleRun(
  ctx: ActionCtx,
  openaiThreadId: string,
  openaiAssistantId: string,
  userId: Id<"users">,
  onContentChunk: (contentChunk: string, fullContentSoFar: string) => Promise<void>,
  onError: (error: string) => Promise<void>,
  onDone: () => Promise<void>,
  onMessageDone?: (messageId: string, messageContent: string) => Promise<void>,
): Promise<void> {
  try {
    const run = await openai.beta.threads.runs.create(openaiThreadId, {
      assistant_id: openaiAssistantId,
      tools: tools,
      stream: true,
      additional_instructions: chatPrompt.system,
    });

    let fullContent = "";
    for await (const event of run) {
      if (DEBUG) {
        console.log("[handleRun]: Event:", event);
      }

      if (event.event === "thread.run.requires_action") {
        if (event.data.required_action?.type === "submit_tool_outputs") {
          const toolOutputs = await handleRunStreamToolCalls(
            ctx,
            event.data.required_action.submit_tool_outputs.tool_calls,
            userId,
          );

          const continuedStream = openai.beta.threads.runs.submitToolOutputsStream(
            openaiThreadId,
            event.data.id,
            {
              tool_outputs: toolOutputs,
              stream: true,
            },
          );

          // Process continued stream using the same handler
          for await (const continuedEvent of continuedStream) {
            const { fullContent: updatedContent, shouldReturn } = await processStreamContent(
              continuedEvent,
              fullContent,
              onContentChunk,
              onDone,
              onError,
              onMessageDone,
            );

            fullContent = updatedContent;
            if (shouldReturn) return;
          }
        }
      } else {
        const { fullContent: updatedContent, shouldReturn } = await processStreamContent(
          event,
          fullContent,
          onContentChunk,
          onDone,
          onError,
          onMessageDone,
        );

        fullContent = updatedContent;
        if (shouldReturn) return;
      }
    }
  } catch (error) {
    console.error("[handleRun]: Error in streaming run:", error);
    await onError(error instanceof Error ? error.message : "Unknown error");
  }
}
