/******************************************************************************
 * MUTATIONS
 *
 * Responsibility chain:
 * 1. Data validation (convex validates args)
 * 2. Authentication check (using auth guard)
 * 3. Authorization check (using file guard)
 * 4. Data operation (using helpers)
 * 5. Related operations (like cascade deletes)
 *
 * Available mutations:
 * - create: Create new file
 * - update: Update existing file
 * - remove: Delete file
 ******************************************************************************/

import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { MutationCtx, mutation } from "./_generated/server";

import { authenticationGuard } from "./users_guards";

import {
  fileInSchema,
  FileInType,
  fileUpdateSchema,
  FileUpdateType,
} from "./files_schema";
import {
  createFile,
  updateFile,
  deleteFile,
  getFileById,
} from "./files_helpers";
import { ownershipGuard } from "./files_guards";

/**
 * Create a new file for the authenticated user.
 */
export const create = mutation({
  args: { ...fileInSchema },
  handler: async (ctx: MutationCtx, args: FileInType): Promise<Id<"files">> => {
    const userId = await authenticationGuard(ctx);
    return await createFile(ctx, userId, args);
  },
});

/**
 * Update an existing file.
 * The authenticated user must own the file, or an error is thrown.
 */
export const update = mutation({
  args: {
    fileId: v.id("files"),
    ...fileUpdateSchema,
  },
  handler: async (
    ctx: MutationCtx,
    args: FileUpdateType & { fileId: Id<"files"> },
  ): Promise<boolean> => {
    const { fileId, ...data } = args;
    const userId = await authenticationGuard(ctx);
    const file = await getFileById(ctx, fileId);
    ownershipGuard(userId, file.userId);
    await updateFile(ctx, fileId, data);
    return true;
  },
});

/**
 * Delete a file.
 * The authenticated user must own the file, or an error is thrown.
 */
export const remove = mutation({
  args: {
    fileId: v.id("files"),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      fileId: Id<"files">;
    },
  ): Promise<boolean> => {
    const userId = await authenticationGuard(ctx);
    const file = await getFileById(ctx, args.fileId);
    ownershipGuard(userId, file.userId);
    await deleteFile(ctx, args.fileId);
    await ctx.storage.delete(file.storageId);
    return true;
  },
});
