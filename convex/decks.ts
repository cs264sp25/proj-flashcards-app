/******************************************************************************
 * DECKS MODULE
 *
 * This module handles deck management following a clear separation of
 * responsibilities pattern.
 *
 * Design Patterns:
 *
 * 1. Separation of Concerns:
 *    Client Request
 *    └─► Mutation/Query (auth + authorization + orchestration)
 *        └─► Guards (access control)
 *            └─► Helpers (pure database operations)
 *
 * 2. Data Integrity:
 *    - Cascading deletes handled at helper level
 *    - Card count maintained through `adjustCardCount`
 *    - Consistent error handling
 *    - Atomic operations where possible
 *
 * 3. Access Control:
 *    - Authentication always checked first
 *    - Authorization follows authentication
 *    - Ownership verified before any operation
 ******************************************************************************/
import {
  defineTable,
  PaginationResult,
  IndexRangeBuilder,
  paginationOptsValidator,
} from "convex/server";
import { ConvexError, Infer, v } from "convex/values";
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
  internalAction,
  QueryCtx,
  MutationCtx,
  ActionCtx,
} from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

import {
  SortOrder,
  type PaginationOptsType,
  type SortOrderType,
} from "./shared";
import { authenticationGuard } from "./users";
import { removeAllCardsInDeck } from "./cards";

/******************************************************************************
 * SCHEMA
 *
 * Defines types and database schema for decks:
 * - DeckInType: Fields that can be provided when creating/updating
 * - DeckUpdateType: Fields that can be updated
 * - DeckType: Complete deck document type including system fields
 * Includes database indexes for efficient querying (by_user_id)
 ******************************************************************************/

/**
 * Type representing the fields that can be provided when creating a deck
 */
export const deckInSchema = {
  title: v.string(),
  description: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
};

// eslint-disable-next-line
const deckInSchemaObject = v.object(deckInSchema);
export type DeckInType = Infer<typeof deckInSchemaObject>;

/**
 * Type representing the fields that can be provided when updating a deck
 */
export const deckUpdateSchema = {
  ...deckInSchema,
  title: v.optional(v.string()),
};

// eslint-disable-next-line
const deckUpdateSchemaObject = v.object(deckUpdateSchema);
export type DeckUpdateType = Infer<typeof deckUpdateSchemaObject>;

/**
 * Type representing a deck in the database
 */
export const deckSchema = {
  ...deckInSchema,
  cardCount: v.number(),
  userId: v.id("users"),
  // Convex will automatically add `_id` and `_creationTime` fields to the schema
};

// eslint-disable-next-line
const deckSchemaObject = v.object(deckSchema);
export type DeckType = Infer<typeof deckSchemaObject>;

/**
 * Deck table schema definition
 */
export const deckTables = {
  decks: defineTable(deckSchema).index("by_user_id", ["userId"]),
};

/******************************************************************************
 * GUARDS
 *
 * Authorization checks:
 * - ownershipGuard: Verifies deck ownership
 *   - Throws 403 error for unauthorized access
 ******************************************************************************/

/**
 * Check if the deck is owned by the user and throw an error if not.
 */
export const ownershipGuard = (
  userId: Id<"users">,
  deckUserId: Id<"users">,
): void => {
  if (deckUserId !== userId) {
    throw new ConvexError({
      message: "Not authorized to access this deck",
      code: 403,
    });
  }
};

/******************************************************************************
 * HELPERS
 *
 * Pure database operations without auth/authorization checks:
 * - Core CRUD operations:
 *   - getAllDecks: Basic deck retrieval with optional filters
 *   - getDeckById: Single deck retrieval
 *   - createDeck: Basic deck creation
 *   - updateDeck: Basic deck update
 *   - deleteDeck: Basic deck deletion
 * - Special operations:
 *   - adjustCardCount: Manages deck's card count
 *   - deleteDecksWithCascade: Handles deletion of deck and its cards
 *   - deleteAllDecksWithCascade: Bulk delete decks with cascade
 ******************************************************************************/

// Get all decks with pagination and optional filtering by userId and sorting
export async function getAllDecks(
  ctx: QueryCtx,
  paginationOpts: PaginationOptsType,
  userId?: Id<"users">,
  sortOrder?: SortOrderType,
) {
  sortOrder = sortOrder || "asc";

  const results: PaginationResult<Doc<"decks">> = await ctx.db
    .query("decks")
    .withIndex(
      "by_user_id",
      (q: IndexRangeBuilder<Doc<"decks">, ["userId", "_creationTime"], 0>) => {
        let q1;

        if (userId) {
          q1 = q.eq("userId", userId);
        }

        return q1 || q;
      },
    )
    .order(sortOrder)
    .paginate(paginationOpts);

  return {
    ...results,
    page: results.page, // This is the data (records) for the current page; we can transform it if needed
  };
}

export async function getDeckById(ctx: QueryCtx, deckId: Id<"decks">) {
  const deck = await ctx.db.get(deckId);
  if (!deck) {
    throw new ConvexError({
      message: `Deck ${deckId} not found`,
      code: 404,
    });
  }
  return deck;
}

export async function createDeck(
  ctx: MutationCtx,
  userId: Id<"users">,
  data: DeckInType,
) {
  return await ctx.db.insert("decks", { ...data, cardCount: 0, userId });
}

export async function updateDeck(
  ctx: MutationCtx,
  deckId: Id<"decks">,
  data: DeckUpdateType,
) {
  await ctx.db.patch(deckId, data);
}

export async function deleteDeck(ctx: MutationCtx, deckId: Id<"decks">) {
  await ctx.db.delete(deckId);
}

// Provide a negative delta to decrease the card count, e.g., when deleting
// cards.
export async function adjustCardCount(
  ctx: MutationCtx,
  deckId: Id<"decks">,
  delta: number,
) {
  const deck = await getDeckById(ctx, deckId);
  await ctx.db.patch(deckId, { cardCount: deck.cardCount + delta });
}

export async function deleteDeckWithCascade(
  ctx: MutationCtx,
  deckId: Id<"decks">,
) {
  await removeAllCardsInDeck(ctx, deckId);
  await deleteDeck(ctx, deckId);
}

// Can be used to delete all decks for a user or all decks in the system.
// TODO: This function is not efficient for large datasets. It should be
// changed to batch delete decks over scheduled actions.
export async function deleteAllDecksWithCascade(
  ctx: MutationCtx,
  userId?: Id<"users">,
) {
  const decks = await ctx.db
    .query("decks")
    .withIndex(
      "by_user_id",
      (q: IndexRangeBuilder<Doc<"decks">, ["userId", "_creationTime"], 0>) => {
        let q1;

        if (userId) {
          q1 = q.eq("userId", userId);
        }

        return q1 || q;
      },
    )
    .collect();

  await Promise.all(
    decks.map((message) => deleteDeckWithCascade(ctx, message._id)),
  );

  return decks.length;
}

/******************************************************************************
 * QUERIES
 *
 * Responsibility chain:
 * 1. Authentication check (using auth guard)
 * 2. Authorization check (using deck guard)
 * 3. Data operation (using helpers)
 *
 * Available queries:
 * - getAll: List user's decks
 * - getOne: Get single deck
 ******************************************************************************/

/**
 * Get all decks for the authenticated user, optionally sorted by the given order
 */
export const getAll = query({
  args: {
    paginationOpts: paginationOptsValidator,
    sortOrder: v.optional(SortOrder),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      sortOrder?: SortOrderType;
    },
  ) => {
    const userId = await authenticationGuard(ctx);
    return await getAllDecks(ctx, args.paginationOpts, userId, args.sortOrder);
  },
});

/**
 * Get a single deck by ID.
 * The authenticated user must own the deck, or an error is thrown.
 */
export const getOne = query({
  args: {
    deckId: v.id("decks"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      deckId: Id<"decks">;
    },
  ) => {
    const userId = await authenticationGuard(ctx);
    const deck = await getDeckById(ctx, args.deckId);
    ownershipGuard(userId, deck.userId);
    return deck;
  },
});

/******************************************************************************
 * MUTATIONS
 *
 * Responsibility chain:
 * 1. Data validation (convex validates args)
 * 2. Authentication check (using auth guard)
 * 3. Authorization check (using deck guard)
 * 4. Data operation (using helpers)
 * 5. Related operations (like cascade deletes)
 *
 * Available mutations:
 * - create: Create new deck
 * - update: Update existing deck
 * - remove: Delete deck with cascade
 ******************************************************************************/

/**
 * Create a new deck for the authenticated user.
 */
export const create = mutation({
  args: { ...deckInSchema },
  handler: async (
    ctx: MutationCtx,
    args: DeckInType & {
      userId: Id<"users">;
    },
  ) => {
    const userId = await authenticationGuard(ctx);
    return await createDeck(ctx, userId, args);
  },
});

/**
 * Update an existing deck.
 * The authenticated user must own the deck, or an error is thrown.
 */
export const update = mutation({
  args: {
    deckId: v.id("decks"),
    ...deckUpdateSchema,
  },
  handler: async (
    ctx: MutationCtx,
    args: DeckUpdateType & {
      deckId: Id<"decks">;
    },
  ) => {
    const { deckId, ...data } = args;
    const userId = await authenticationGuard(ctx);
    const deck = await getDeckById(ctx, deckId);
    ownershipGuard(userId, deck.userId);
    await updateDeck(ctx, deckId, data);
    return true;
  },
});

/**
 * Delete a deck (and its cards) given its ID.
 * The authenticated user must own the deck, or an error is thrown.
 */
export const remove = mutation({
  args: {
    deckId: v.id("decks"),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      deckId: Id<"decks">;
    },
  ) => {
    const userId = await authenticationGuard(ctx);
    const deck = await getDeckById(ctx, args.deckId);
    ownershipGuard(userId, deck.userId);
    await deleteDeckWithCascade(ctx, args.deckId);
    return true;
  },
});

/******************************************************************************
 * INTERNALS
 *
 * Internal operations not exposed to clients:
 * - Used by seeding and system operations
 * - Bypasses auth/authorization for internal use
 ******************************************************************************/

/**
 * Get all decks for the given user, optionally sorted by the given order
 */
export const getAllInternal = internalQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    sortOrder: v.optional(SortOrder),
    userId: v.id("users"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      sortOrder?: SortOrderType;
      userId: Id<"users">;
    },
  ) => {
    return await getAllDecks(
      ctx,
      args.paginationOpts,
      args.userId,
      args.sortOrder,
    );
  },
});

/**
 * Create a new deck for the given user.
 * An internal mutation wrapper around the createDeck helper.
 * Used when we want to create a deck in a different context (ctx) like in seeding Actions.
 */
export const createDeckInternal = internalMutation({
  args: {
    userId: v.id("users"),
    deck: v.object(deckInSchema),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      userId: Id<"users">;
      deck: DeckInType;
    },
  ) => {
    return await createDeck(ctx, args.userId, args.deck);
  },
});

/**
 * Delete all decks (and their cards) for the given user.
 * An internal mutation wrapper around the deleteAllDecksWithCascade helper.
 * Used when we want to delete decks in a different context (ctx) like in seeding Actions.
 */
export const deleteDecksWithCascadeInternal = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      userId: Id<"users">;
    },
  ) => {
    await deleteAllDecksWithCascade(ctx, args.userId);
  },
});

/******************************************************************************
 * SEED
 *
 * Testing and development data generation:
 * - Uses internal mutations to bypass auth
 ******************************************************************************/

/**
 * Create sample decks for a user.
 * numberOfDecks is optional and defaults to 5.
 * If clearExistingData is true, deletes all existing decks for the user.
 */
export const createSampleDecks = internalAction({
  args: {
    userId: v.id("users"),
    numberOfDecks: v.optional(v.number()),
    clearExistingData: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = args.userId;
    const numberOfDecks = args.numberOfDecks || 5;
    const clearExistingData = args.clearExistingData || false;
    const deckIds: Id<"decks">[] = [];

    if (clearExistingData) {
      await ctx.runMutation(
        // @ts-ignore
        internal.decks.deleteDecksWithCascadeInternal,
        {
          userId: args.userId,
        },
      );
    }

    for (let i = 0; i < numberOfDecks; i++) {
      const deckId = await ctx.runMutation(
        // @ts-ignore
        internal.decks.createDeckInternal,
        {
          userId,
          deck: { title: `Deck ${i + 1}` },
        },
      );

      deckIds.push(deckId as Id<"decks">);
    }

    return deckIds;
  },
});
