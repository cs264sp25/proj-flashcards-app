/******************************************************************************
 * SHARED MODULE
 *
 * This module contains utilities and types shared across different modules
 * in the application.
 *
 * Design Patterns:
 * 1. Type Safety:
 *    - All shared utilities maintain type safety
 *    - Validators ensure runtime type checking
 *    - TypeScript types provide compile-time checking
 *
 * 2. Reusability:
 *    - Generic implementations for common patterns
 *    - Consistent behavior across modules
 *    - DRY (Don't Repeat Yourself) principle
 ******************************************************************************/
import { Infer, v } from "convex/values";
import { mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

import { authenticationGuard } from "./users";

/******************************************************************************
 * SCHEMA
 *
 * Shared type definitions and validators
 ******************************************************************************/

/**
 * Sort direction validator
 * - Supports "asc" or "desc"
 * - Used for consistent sorting across queries
 */
export const SortOrder = v.union(v.literal("asc"), v.literal("desc"));
export type SortOrderType = Infer<typeof SortOrder>;

/**
 * Pagination options type
 * - Used for consistent pagination across queries
 */
export type PaginationOptsType = Infer<typeof paginationOptsValidator>;

/******************************************************************************
 * MUTATIONS
 *
 * Shared mutation operations
 ******************************************************************************/

/**
 * Generate short lived URL for file upload
 * - Used in file module to upload files to Convex storage
 */
export const generateUploadUrl = mutation(async (ctx) => {
  await authenticationGuard(ctx);
  return await ctx.storage.generateUploadUrl();
});

/******************************************************************************
 * HELPERS
 *
 * Generic utility functions used across modules
 ******************************************************************************/

// Add shared helper functions here as needed.
