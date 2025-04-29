/******************************************************************************
 * SEED
 *
 * Testing and development data generation:
 * - Uses internal mutations to bypass auth
 ******************************************************************************/

import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { ActionCtx, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// The default number of files to create.
const NUM_FILES = 5;
const CLEAR_EXISTING_DATA = false;

/**
 * Create sample files for a user.
 * numberOfFiles is optional and defaults to NUM_FILES.
 * If clearExistingData is true, deletes all existing files for the user.
 */
export const createSampleFiles = internalAction({
  args: {
    userId: v.id("users"),
    numberOfFiles: v.optional(v.number()),
    clearExistingData: v.optional(v.boolean()),
  },
  handler: async (
    ctx: ActionCtx,
    args: {
      userId: Id<"users">;
      numberOfFiles?: number;
      clearExistingData?: boolean;
    },
  ): Promise<Id<"files">[]> => {
    const userId = args.userId;
    const numberOfFiles = args.numberOfFiles || NUM_FILES;
    const clearExistingData = args.clearExistingData || CLEAR_EXISTING_DATA;
    const fileIds: Id<"files">[] = [];

    if (clearExistingData) {
      await ctx.runMutation(
        // @ts-ignore
        internal.files.internals.deleteFiles,
        {
          userId: args.userId,
        },
      );
    }

    for (let i = 0; i < numberOfFiles; i++) {
      // TODO: Find a way to actually store some data in the storage
      const storageId = "fake_storage_id" as Id<"_storage">;
      const fileId = await ctx.runMutation(
        // @ts-ignore
        internal.files.internals.createFile,
        {
          userId,
          file: { title: `File ${i + 1}`, storageId },
        },
      );

      fileIds.push(fileId as Id<"files">);
    }

    return fileIds;
  },
});
