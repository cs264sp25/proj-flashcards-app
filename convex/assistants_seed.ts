/******************************************************************************
 * SEED
 *
 * Seed script for Assistants:
 * - seedAssistants: Creates a default 'Learning Companion' assistant if none exist.
 ******************************************************************************/

import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { createAssistant } from "./assistants_helpers"; // Import the helper

// Define the details for the default assistant
const defaultAssistantData = {
  name: "Learning Companion",
  description:
    "An AI assistant designed to help you study and learn with flashcards.",
  instructions:
    "You are a friendly and encouraging learning companion. Help users understand concepts, review flashcards, and stay motivated. Be concise and clear in your explanations. Ask clarifying questions if needed.",
  model: "gpt-4o-mini",
  temperature: 0.2,
  tools: [], // No specific tools needed for the basic companion initially
  metadata: {},
};

/**
 * Seeds the database with a default assistant if none exist.
 */
export const seedAssistants = mutation({
  handler: async (ctx) => {
    // Check if any assistants already exist
    const existingAssistant = await ctx.db.query("assistants").first();

    if (existingAssistant) {
      console.log("Assistants already seeded. Skipping.");
      return;
    }

    console.log("Seeding default assistant...");

    // Use the helper to create the assistant document in the database
    const assistantId = await createAssistant(ctx, defaultAssistantData);

    // Schedule the action to create the corresponding OpenAI assistant
    await ctx.scheduler.runAfter(
      0,
      internal.openai_assistants.createAssistant,
      {
        assistantId, // Pass the newly created Convex ID
        ...defaultAssistantData, // Pass the rest of the assistant details
      },
    );

    console.log(`Default assistant seeded with ID: ${assistantId}`);
  },
});
