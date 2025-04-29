/******************************************************************************
 * HELPER FUNCTIONS
 *
 * Helper functions/constants for OpenAI operations.
 ******************************************************************************/
import OpenAI from "openai";

export const getOpenAIClient = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

/**
 * Initialize OpenAI client
 */
export const openai = getOpenAIClient();
