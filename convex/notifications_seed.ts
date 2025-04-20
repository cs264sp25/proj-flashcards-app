/******************************************************************************
 * SEED
 *
 * Testing and development data generation:
 * - Uses internal mutations to bypass auth
 ******************************************************************************/

import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// The default number of notifications to create.
const NUM_NOTIFICATIONS = 10;
const OODS_OF_READ = 0.8;
const CLEAR_EXISTING_DATA = false;

/**
 * Create sample notifications for a user.
 * number is optional and defaults to 10.
 * If clearExistingData is true, deletes all existing notifications for the user.
 */
export const createSampleNotifications = internalAction({
  args: {
    userId: v.id("users"),
    number: v.optional(v.number()),
    clearExistingData: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = args.userId;
    const number = args.number || NUM_NOTIFICATIONS;
    const clearExistingData = args.clearExistingData || CLEAR_EXISTING_DATA;
    const notificationIds: Id<"notifications">[] = [];

    if (clearExistingData) {
      await ctx.runMutation(
        internal.notifications_internals.deleteNotifications,
        {
          userId: args.userId,
        },
      );
    }

    for (let i = 0; i < number; i++) {
      const notificationId = await ctx.runMutation(
        internal.notifications_internals.createNotification,
        {
          userId,
          notification: {
            title: `Notification ${i + 1}`,
            description: `This is notification number ${i + 1}`,
            is_read: Math.random() > OODS_OF_READ, // 20% chance of being read
          },
        },
      );

      notificationIds.push(notificationId as Id<"notifications">);
    }

    return notificationIds;
  },
});
