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
    return await createAssistant(ctx, args);
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
    // Use the helper to update the assistant in the database
    await updateAssistant(ctx, assistantId, updateData);
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
    // Use the helper to delete the assistant
    await deleteAssistant(ctx, args.assistantId);
    return true;
  },
});
