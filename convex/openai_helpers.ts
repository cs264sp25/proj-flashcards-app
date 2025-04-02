/******************************************************************************
 * HELPER FUNCTIONS
 *
 * Helper functions for AI operations:
 * - getCompletion: Gets a completion from OpenAI's API.
 * - getEmbedding: Gets an embedding from OpenAI's API.
 ******************************************************************************/
import { createOpenAI } from "@ai-sdk/openai";
import { embed, streamText, ToolSet } from "ai";
import { MessageType } from "./openai_schema";

const DEBUG = true;

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: "strict", // strict mode, enable when using the OpenAI API
});

/**
 * Gets a completion from OpenAI's API.
 */
export const getCompletion = async (
  messages: MessageType[],
  model: string = "gpt-4o-mini",
  temperature: number = 0,
  maxSteps: number = 10,
  tools?: ToolSet,
) => {
  const result = streamText({
    model: openai(model),
    temperature,
    messages,
    tools,
    maxSteps,
    onStepFinish: async ({
      // text,
      // reasoning,
      // sources,
      // toolCalls,
      // toolResults,
      // finishReason,
      // usage,
      // warnings,
      // logprobs,
      request,
      // response,
      // providerMetadata,
      // stepType,
      // isContinued,
    }) => {
      // For debugging, if needed
      // console.log("Text", text);
      // console.log("Tool calls:", toolCalls);
      // console.log("Tool results:", toolResults);
      // console.log("Reasoning:", reasoning);
      // console.log("Sources:", sources);
      // console.log("Finish reason:", finishReason);
      // console.log("Usage:", usage);
      // console.log("Warnings:", warnings);
      // console.log("Logprobs:", logprobs);
      // console.log("Request:", request);
      // console.log("Response:", response);
      // console.log("Provider metadata:", providerMetadata);
      // console.log("Step type:", stepType);
      // console.log("Is continued:", isContinued);

      if (DEBUG) {
        // All the messages sent to AI at this point
        const body = JSON.parse(request.body || "{}");
        console.log("Request body:", body);
      }
    },
  });

  return result;
};

/**
 * Gets an embedding from OpenAI's API.
 */
export const getEmbedding = async (
  text: string,
  model: string = "text-embedding-3-small",
) => {
  const { embedding } = await embed({
    model: openai.embedding(model),
    value: text,
  });

  return embedding;
};
