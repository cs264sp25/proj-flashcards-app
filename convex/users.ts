/******************************************************************************
 * USERS MODULE
 *
 * This module handles user CRUD operations for the application.
 ******************************************************************************/
import { defineTable, PaginationResult } from "convex/server";
import { ConvexError, Infer, v } from "convex/values";
import {
  QueryCtx,
  MutationCtx,
  query,
  mutation,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

import type { PaginationOptsType, SortOrderType } from "./shared";
import { deleteAllDecksWithCascade } from "./decks";
import { deleteAllChatsWithCascade } from "./chats";

/******************************************************************************
 * SCHEMA
 *
 * Data models and type definitions:
 * - Defines user table schema and types
 * - Contains user update schema for profile modifications
 * - Includes database indexes for efficient queries
 *
 * Note: In `convex/schema.ts`, you should import the `userTables`
 *  in this file and `authTables` from `"@convex-dev/auth/server"`:
 *
 * import { defineSchema } from "convex/server";
 * import { authTables } from "@convex-dev/auth/server";
 * import { userTables } from "./auth";
 *
 * const schema = defineSchema({
 *   ...authTables,
 *   ...userTables,
 * });
 ******************************************************************************/

/**
 * Type representing the fields that can be provided when updating a user
 */
export const userUpdateSchema = {
  name: v.optional(v.string()),
  imageFileStorageId: v.optional(v.id("_storage")),
  displayName: v.optional(v.string()),
};

// eslint-disable-next-line
const userUpdateSchemaObject = v.object(userUpdateSchema);
export type UserUpdateType = Infer<typeof userUpdateSchemaObject>;

/**
 * Type representing a user in the database. These are all defined as optional
 * because different auth providers may provide different fields
 */
const userSchema = {
  // The following fields are what Convex Auth defines in the user schema
  // name: v.optional(v.string()), // Already defined in userUpdateSchema
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),
  // These are additional fields
  ...userUpdateSchema,
  // Convex will automatically add `_id` and `_creationTime` fields to the schema
};

// eslint-disable-next-line
const userSchemaObject = v.object(userSchema);
export type UserType = Infer<typeof userSchemaObject>;

/**
 * User table schema definition
 */
export const userTables = {
  users: defineTable(userSchema).index("email", ["email"]),
};

/******************************************************************************
 * GUARDS
 *
 * Authentication guards and checks:
 * - authenticationGuard: Helper function to verify user authentication
 *   - Throws 401 error if user is not authenticated
 ******************************************************************************/

// Helper function to get the user ID from the authentication token.
// Throws an error if the user is not authenticated.
export const authenticationGuard = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError({
      message: "Not authenticated",
      code: 401,
    });
  }
  return userId;
};

/******************************************************************************
 * HELPERS
 *
 * Utility functions for auth operations:
 * - User CRUD operations (create, read, update, delete)
 * - Pagination and sorting utilities
 * - Cascade deletion functionality for user data
 ******************************************************************************/

// Get all users with pagination and optional sorting
export async function getAllUsers(
  ctx: QueryCtx,
  paginationOpts: PaginationOptsType,
  sortOrder?: SortOrderType,
) {
  sortOrder = sortOrder || "asc";

  const results: PaginationResult<Doc<"users">> = await ctx.db
    .query("users")
    .order(sortOrder)
    .paginate(paginationOpts);

  return {
    ...results,
    page: results.page, // This is the data (records) for the current page; we can transform it if needed
  };
}

export async function getUserById(ctx: QueryCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError({
      message: `User ${userId} not found`,
      code: 404,
    });
  }
  return user;
}

export async function updateUser(
  ctx: MutationCtx,
  userId: Id<"users">,
  data: UserUpdateType,
) {
  await ctx.db.patch(userId, data);
}

export async function deleteUser(ctx: MutationCtx, userId: Id<"users">) {
  await ctx.db.delete(userId);
}

// Delete a user (and all associated data) given their ID
// This is helpful when a user wants to delete their account
// This function can reach Convex limit if called in a mutation.
// It's better to call this function in a background job.
export async function deleteUserWithCascade(
  ctx: MutationCtx,
  userId: Id<"users">,
) {
  // Delete all decks and cards for the user
  // await deleteAllDecksWithCascade(ctx, userId);
  // Delete all chats for the user
  // await deleteAllChatsWithCascade(ctx, userId);

  // FIXME: Uncommenting the above lines will cause a strange error durring pushing code to Convex

  // Delete the user
  await deleteUser(ctx, userId);
}

/******************************************************************************
 * QUERIES
 *
 * Authentication related queries:
 * - getAuthenticatedUser: Gets the current authenticated user from session
 ******************************************************************************/

// Get the user from the authentication token.
// Returns null if the user is not authenticated.
export const getAuthenticatedUser = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const userId = await getAuthUserId(ctx);
    return userId !== null ? ctx.db.get(userId) : null;
  },
});

/******************************************************************************
 * MUTATIONS
 *
 * Authentication related mutations:
 * - update: Handles user profile updates including display name and profile image
 * - Implements security checks and file storage management
 ******************************************************************************/

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

/******************************************************************************
 * INTERNAL MUTATIONS
 *
 * Internal mutations for users:
 * - Used by seeding utilities
 ******************************************************************************/

/**
 * Internal mutation to create a user.
 * This bypasses authentication checks and is used for seeding.
 */
export const createUserInternal = internalMutation({
  args: {
    user: v.object(userSchema),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", args.user);
    return userId;
  },
});

/******************************************************************************
 * SEED
 *
 * Testing and development data generation:
 * - Uses internal mutations to bypass auth
 ******************************************************************************/

/**
 * Create sample users.
 * numberOfUsers is optional and defaults to 5.
 *
 * NOTE: This seed function does NOT clear previously seeded data for safety reasons.
 * It only adds new sample users to the database.
 */
export const createSampleUsers = internalAction({
  args: {
    numberOfUsers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const numberOfUsers = args.numberOfUsers || 5;
    const userIds: Id<"users">[] = [];

    for (let i = 0; i < numberOfUsers; i++) {
      const userId = await ctx.runMutation(internal.users.createUserInternal, {
        user: {
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          displayName: `Test User ${i + 1}`,
          isAnonymous: false,
        },
      });

      userIds.push(userId as Id<"users">);
    }

    return userIds;
  },
});
