/******************************************************************************
 * USERS MUTATIONS MODULE
 *
 * This module contains mutation functions for user operations.
 ******************************************************************************/
import { ConvexError, v } from "convex/values";
import { mutation, MutationCtx } from "./_generated/server";
import { authenticationGuard } from "./users_guards";
import { getUserById, updateUser } from "./users_helpers";
import { userUpdateSchema, type UserUpdateType } from "./users_schema";
import { Id } from "./_generated/dataModel";

/**
 * Update user profile
 */
export const update = mutation({
  args: {
    userId: v.id("users"),
    ...userUpdateSchema,
  },
  handler: async (
    ctx: MutationCtx,
    args: UserUpdateType & { userId: Id<"users"> },
  ) => {
    const userId = await authenticationGuard(ctx);
    if (userId !== args.userId) {
      throw new ConvexError({
        message: "You can only update your own profile",
        code: 403,
      });
    }

    const user = await getUserById(ctx, userId);

    if (
      args.imageFileStorageId &&
      args.imageFileStorageId !== user.imageFileStorageId
    ) {
      // Keep the oldStorageId to remove the existing file from storage
      const oldStorageId = user.imageFileStorageId;

      // update the user's imageFileStorageId
      await updateUser(ctx, userId, {
        imageFileStorageId: args.imageFileStorageId,
      });

      // update the user's image to the URL from the imageFileStorageId
      ctx.db.patch(userId, {
        image: (await ctx.storage.getUrl(args.imageFileStorageId)) as string,
      });

      if (oldStorageId) {
        await ctx.storage.delete(oldStorageId);
      }

      return true;
    }

    if (args.name && args.name !== user.name) {
      await updateUser(ctx, userId, {
        name: args.name,
      });
      return true;
    }

    if (args.displayName && args.displayName !== user.displayName) {
      await updateUser(ctx, userId, {
        displayName: args.displayName,
      });
      return true;
    }

    return false;
  },
});
