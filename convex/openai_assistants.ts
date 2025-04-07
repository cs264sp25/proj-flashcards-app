/******************************************************************************
 * OPENAI ASSISTANTS
 *
 * Actions for creating, updating, and deleting assistants in OpenAI.
 ******************************************************************************/
import OpenAI from "openai";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

import {
  assistantInSchema,
  assistantUpdateSchema,
} from "./assistants_schema";

const DEBUG = false;

// Internal action to create an assistant in OpenAI
export const createAssistant = internalAction({
  args: {
    assistantId: v.id("assistants"),
    ...assistantInSchema,
  },
  handler: async (ctx, args) => {
    try {
      // Instantiate the OpenAI API client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Create the assistant in OpenAI
      const assistant = await openai.beta.assistants.create({
        name: args.name,
        description: args.description,
        instructions: args.instructions,
        model: args.model,
        temperature: args.temperature,
        tools: args.tools || [],
        metadata: args.metadata || {},
      });

      // Update our database with the OpenAI assistant ID
      await ctx.runMutation(internal.assistants_internals.updateOpenAIId, {
        assistantId: args.assistantId,
        openaiAssistantId: assistant.id,
      });

      return assistant.id;
    } catch (error) {
      // If there's an error, we should handle it and possibly clean up
      console.error("Error creating assistant in OpenAI:", error);

      // Delete the placeholder assistant from our database
      await ctx.runMutation(
        internal.assistants_internals.deleteFailedAssistant,
        {
          assistantId: args.assistantId,
        },
      );

      throw error;
    }
  },
});

// Internal action to update an assistant in OpenAI
export const updateAssistant = internalAction({
  args: {
    assistantId: v.id("assistants"),
    ...assistantUpdateSchema,
    // override the required assistantId field
    openaiAssistantId: v.string(),
    // override some fields to be optional
    name: v.optional(v.string()),
    instructions: v.optional(v.string()),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Instantiate the OpenAI API client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const { assistantId: _, openaiAssistantId, ...updateParams } = args;

      // Update the assistant in OpenAI
      await openai.beta.assistants.update(openaiAssistantId, updateParams);

      return { success: true };
    } catch (error) {
      console.error("Error updating assistant in OpenAI:", error);
      throw error;
    }
  },
});

// Internal action to delete an assistant in OpenAI
export const deleteAssistant = internalAction({
  args: {
    openaiAssistantId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Instantiate the OpenAI API client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Delete the assistant in OpenAI
      await openai.beta.assistants.del(args.openaiAssistantId);

      return { success: true };
    } catch (error) {
      console.error("Error deleting assistant in OpenAI:", error);
      throw error;
    }
  },
});
