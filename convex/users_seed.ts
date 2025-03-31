/******************************************************************************
 * USERS SEED MODULE
 *
 * This module contains functions for seeding test data.
 ******************************************************************************/
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// The defaultnumber of users to create.
const NUM_USERS = 5;

/**
 * Create sample users.
 * numberOfUsers is optional and defaults to NUM_USERS.
 *
 * NOTE: This seed function does NOT clear previously seeded data for safety reasons.
 * It only adds new sample users to the database.
 */
export const createSampleUsers = internalAction({
  args: {
    numberOfUsers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const numberOfUsers = args.numberOfUsers || NUM_USERS;
    const userIds: Id<"users">[] = [];

    for (let i = 0; i < numberOfUsers; i++) {
      const userId = await ctx.runMutation(internal.users_internals.create, {
        user: {
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          displayName: `Test User ${i + 1}`,
          isAnonymous: false,
        },
      });

      userIds.push(userId);
    }

    return userIds;
  },
});
