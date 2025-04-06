/******************************************************************************
 * QUERIES
 *
 * Responsibility chain:
 * 1. Authentication check (using auth guard)
 * 2. Data operation (using helpers)
 *
 * Public-facing query functions for Assistants with authorization:
 * - getAll: Get all assistants with pagination, sorting, and search.
 * - getOne: Get a single assistant by ID
 ******************************************************************************/
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, query } from "./_generated/server";

import { PaginationOptsType, SortOrder, SortOrderType } from "./shared";
import { authenticationGuard } from "./users_guards";
import { AssistantOutType } from "./assistants_schema";
import { getAllAssistants, getAssistantById } from "./assistants_helpers";

/**
 * Get all assistants, with pagination, sorting, and search.
 */
export const getAll = query({
  args: {
    paginationOpts: paginationOptsValidator,
    sortOrder: v.optional(SortOrder),
    searchQuery: v.optional(v.string()),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      sortOrder?: SortOrderType;
      searchQuery?: string;
    },
  ): Promise<PaginationResult<AssistantOutType>> => {
    await authenticationGuard(ctx);
    const results = await getAllAssistants(
      ctx,
      args.paginationOpts,
      args.sortOrder,
      args.searchQuery,
    );

    return {
      ...results,
      page: results.page.map((a) => ({
        _id: a._id,
        _creationTime: a._creationTime,
        name: a.name,
        description: a.description,
        instructions: a.instructions,
        model: a.model,
        temperature: a.temperature,
        metadata: a.metadata,
        tools: a.tools,
        // We don't need to send the openaiAssistantId or searchableContent to the client
      })),
    };
  },
});

/**
 * Get a single assistant by its ID.
 */
export const getOne = query({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      assistantId: Id<"assistants">;
    },
  ): Promise<AssistantOutType> => {
    await authenticationGuard(ctx);
    const assistant = await getAssistantById(ctx, args.assistantId);

    return {
      _id: assistant._id,
      _creationTime: assistant._creationTime,
      name: assistant.name,
      description: assistant.description,
      instructions: assistant.instructions,
      model: assistant.model,
      temperature: assistant.temperature,
      metadata: assistant.metadata,
      tools: assistant.tools,
      // We don't need to send the openaiAssistantId or searchableContent to the client
    };
  },
});
