/******************************************************************************
 * MUTATIONS
 *
 * Public-facing mutation functions for Assistants with authorization:
 * - create: Creates an assistant in DB and schedules OpenAI creation
 * - update: Updates an assistant in DB and schedules OpenAI update
 * - remove: Deletes an assistant from DB and schedules OpenAI deletion
 ******************************************************************************/
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { MutationCtx, mutation } from "./_generated/server";

import {
  assistantInSchema,
  AssistantInType,
  assistantUpdateSchema,
  AssistantUpdateType,
} from "./assistants_schema";
import {
  createAssistant,
  updateAssistant,
  deleteAssistant,
  getAssistantById,
} from "./assistants_helpers";
import { authenticationGuard } from "./users_guards";

/**
 * Create a new assistant.
 * Creates the DB record and schedules OpenAI assistant creation.
 */
export const create = mutation({
  args: assistantInSchema,
  handler: async (
    ctx: MutationCtx,
    args: AssistantInType,
  ): Promise<Id<"assistants">> => {
    await authenticationGuard(ctx);

    // Use the helper to create the assistant in the database
    const assistantId = await createAssistant(ctx, args);

    // Schedule an action to create the assistant in OpenAI
    await ctx.scheduler.runAfter(
      0,
      internal.openai_assistants.createAssistant,
      {
        assistantId, // Pass the new Convex ID
        ...args, // Pass the original input data
      },
    );

    return assistantId;
  },
});

/**
 * Update an assistant.
 * Updates the DB record and schedules OpenAI assistant update if applicable.
 */
export const update = mutation({
  args: {
    assistantId: v.id("assistants"),
    ...assistantUpdateSchema, // Use the update schema for args
  },
  handler: async (
    ctx: MutationCtx,
    args: AssistantUpdateType & {
      assistantId: Id<"assistants">;
    },
  ): Promise<boolean> => {
    await authenticationGuard(ctx);

    const { assistantId, ...updateData } = args;

    // Get the current assistant data (needed for OpenAI ID)
    const assistant = await getAssistantById(ctx, assistantId);

    // Use the helper to update the assistant in the database
    await updateAssistant(ctx, assistantId, updateData);

    // Schedule an action to update the assistant in OpenAI if it has a real ID
    if (
      assistant.openaiAssistantId &&
      assistant.openaiAssistantId !== "pending"
    ) {
      await ctx.scheduler.runAfter(
        0,
        internal.openai_assistants.updateAssistant,
        {
          assistantId: assistantId, // Pass the convex ID
          openaiAssistantId: assistant.openaiAssistantId, // Pass the OpenAI ID
          // Pass only the fields that were provided for the update
          ...updateData,
        },
      );
    }

    return true;
  },
});

/**
 * Delete an assistant.
 * Deletes the DB record and schedules OpenAI assistant deletion if applicable.
 */
export const remove = mutation({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (
    ctx: MutationCtx,
    args: { assistantId: Id<"assistants"> },
  ): Promise<boolean> => {
    await authenticationGuard(ctx);

    // Get the current assistant data (needed for OpenAI ID)
    // Need to handle potential 404 from helper if already deleted
    let assistantOpenAIId: string | undefined | null = null;
    try {
      const assistant = await getAssistantById(ctx, args.assistantId);
      assistantOpenAIId = assistant.openaiAssistantId;
    } catch (error: any) {
      if (error instanceof ConvexError && error.data.code === 404) {
        console.warn(`Assistant ${args.assistantId} already deleted from DB.`);
        // Proceed to attempt OpenAI deletion if an ID might exist
      } else {
        throw error; // Re-throw other errors
      }
    }

    // Use the helper to delete the assistant from the database
    // Helper handles non-existence gracefully (logs warning)
    await deleteAssistant(ctx, args.assistantId);

    // Schedule an action to delete the assistant in OpenAI if it has a real ID
    if (assistantOpenAIId && assistantOpenAIId !== "pending") {
      await ctx.scheduler.runAfter(
        0,
        internal.openai_assistants.deleteAssistant,
        {
          openaiAssistantId: assistantOpenAIId,
        },
      );
    }

    return true;
  },
});
