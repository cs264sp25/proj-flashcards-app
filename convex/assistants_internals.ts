/******************************************************************************
 * INTERNALS
 *
 * Internal operations not exposed to clients:
 * - Used by other operations like seeding and AI actions
 * - Bypasses auth/authorization for internal use
 ******************************************************************************/
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { getAssistantById as getAssistantByIdHelper } from "./assistants_helpers";

export const getAssistantById = internalQuery({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    return await getAssistantByIdHelper(ctx, args.assistantId);
  },
});

// Internal mutation to update the OpenAI assistant ID
export const updateOpenAIId = internalMutation({
  args: {
    assistantId: v.id("assistants"),
    openaiAssistantId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.assistantId, {
      openaiAssistantId: args.openaiAssistantId,
    });
  },
});

// Internal mutation to delete a failed assistant
export const deleteFailedAssistant = internalMutation({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    // Use get instead of patch to ensure the document exists before deleting
    const assistant = await ctx.db.get(args.assistantId);
    if (assistant) {
      await ctx.db.delete(args.assistantId);
    }
  },
});
