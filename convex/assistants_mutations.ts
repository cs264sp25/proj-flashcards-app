/******************************************************************************
 * MUTATIONS
 *
 * Public-facing mutation functions for Assistants with authorization:
 * - create: Creates an assistant in DB and schedules OpenAI creation
 * - update: Updates an assistant in DB and schedules OpenAI update
 * - remove: Deletes an assistant from DB and schedules OpenAI deletion
 ******************************************************************************/

import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { MutationCtx, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

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
 */
export const create = mutation({
  args: assistantInSchema,
  handler: async (
    ctx: MutationCtx,
    args: AssistantInType,
  ): Promise<Id<"assistants">> => {
    // Make sure the user is authenticated
    await authenticationGuard(ctx);
    // Use the helper to create the assistant in the database
    const assistantId = await createAssistant(ctx, args);

    // Schedule the creation of the corresponding OpenAI assistant
    // Need to reconstruct necessary fields potentially modified by the helper
    const name = (args.name || "").trim();
    const description = (args.description || "").trim();
    await ctx.scheduler.runAfter(0, internal.openai_assistants.createAssistant, {
      assistantId, // Pass the new Convex ID
      ...args, // Pass original args provided by the client
      name,    // Pass potentially trimmed name
      description, // Pass potentially trimmed description
    });

    return assistantId;
  },
});

/**
 * Update an assistant.
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
    // Make sure the user is authenticated
    await authenticationGuard(ctx);
    const { assistantId, ...updateData } = args;

    // Get existing assistant data *before* update to access openaiAssistantId
    const existingAssistant = await getAssistantById(ctx, assistantId);

    // Use the helper to update the assistant in the database
    await updateAssistant(ctx, assistantId, updateData);

    // Schedule the update of the corresponding OpenAI assistant
    if (existingAssistant.openaiAssistantId && existingAssistant.openaiAssistantId !== 'pending') {
      // Need to reconstruct necessary fields potentially modified by the helper
      const name = (updateData.name || existingAssistant.name || "").trim();
      const description = (updateData.description || existingAssistant.description || "").trim();
      await ctx.scheduler.runAfter(0, internal.openai_assistants.updateAssistant, {
        assistantId: assistantId,
        openaiAssistantId: existingAssistant.openaiAssistantId,
        ...updateData, // Pass only the fields provided for the update
        name,          // Pass potentially updated/trimmed name
        description,   // Pass potentially updated/trimmed description
      });
    }

    return true;
  },
});

/**
 * Delete an assistant.
 */
export const remove = mutation({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (
    ctx: MutationCtx,
    args: { assistantId: Id<"assistants"> },
  ): Promise<boolean> => {
    // Make sure the user is authenticated
    await authenticationGuard(ctx);

    // Get existing assistant data *before* deleting to access openaiAssistantId
    const existingAssistant = await getAssistantById(ctx, args.assistantId);

    // Schedule the deletion of the corresponding OpenAI assistant *before* deleting Convex data
    if (existingAssistant.openaiAssistantId && existingAssistant.openaiAssistantId !== 'pending') {
      await ctx.scheduler.runAfter(0, internal.openai_assistants.deleteAssistant, {
        openaiAssistantId: existingAssistant.openaiAssistantId,
      });
    }

    // Use the helper to delete the assistant from the database
    await deleteAssistant(ctx, args.assistantId);
    return true;
  },
});
