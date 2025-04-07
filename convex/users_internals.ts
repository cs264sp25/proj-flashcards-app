/******************************************************************************
 * USERS INTERNALS MODULE
 *
 * This module contains internal mutations for user operations.
 ******************************************************************************/
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { userSchema } from "./users_schema";

/**
 * Internal mutation to create a user.
 * This bypasses authentication checks and is used for seeding.
 */
export const create = internalMutation({
  args: {
    user: v.object(userSchema),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", args.user);
    return userId;
  },
});
