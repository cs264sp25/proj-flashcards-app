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
import { IndexRangeBuilder, PaginationResult } from "convex/server";
import { ConvexError } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

import type { DeckInType, DeckOutType, DeckUpdateType } from "./decks_schema";
import type { PaginationOptsType, SortOrderType } from "./shared";
import { removeAllCardsInDeck } from "./cards_helpers";

// Get all decks with pagination, optional filtering by userId, sorting, and search query
export async function getAllDecks(
  ctx: QueryCtx,
  paginationOpts: PaginationOptsType,
  userId?: Id<"users">,
  sortOrder?: SortOrderType,
  searchQuery?: string,
): Promise<PaginationResult<DeckOutType>> {
  sortOrder = sortOrder || "asc";

  let results: PaginationResult<Doc<"decks">>;

  if (searchQuery) {
    results = await ctx.db
      .query("decks")
      .withSearchIndex("search_all", (q) => {
        if (userId) {
          return q
            .search("searchableContent", searchQuery)
            .eq("userId", userId);
        } else {
          return q.search("searchableContent", searchQuery);
        }
      })
      // The order will be the order of the search results
      .paginate(paginationOpts);
  } else {
    results = await ctx.db
      .query("decks")
      .withIndex(
        "by_user_id",
        (
          q: IndexRangeBuilder<Doc<"decks">, ["userId", "_creationTime"], 0>,
        ) => {
          let q1;

          if (userId) {
            q1 = q.eq("userId", userId);
          }

          return q1 || q;
        },
      )
      .order(sortOrder)
      .paginate(paginationOpts);
  }

  return {
    ...results,
    page: results.page.map((deck) => ({
      _id: deck._id,
      _creationTime: deck._creationTime,
      title: deck.title,
      description: deck.description,
      tags: deck.tags,
      cardCount: deck.cardCount,
      userId: deck.userId,
      // We don't need to send the searchableContent or embedding to the client
    })),
  };
}

export async function getDeckById(
  ctx: QueryCtx,
  deckId: Id<"decks">,
): Promise<DeckOutType> {
  const deck = await ctx.db.get(deckId);
  if (!deck) {
    throw new ConvexError({
      message: `Deck ${deckId} not found`,
      code: 404,
    });
  }
  return {
    _id: deck._id,
    _creationTime: deck._creationTime,
    title: deck.title,
    description: deck.description,
    tags: deck.tags,
    cardCount: deck.cardCount,
    userId: deck.userId,
    // We don't need to send the searchableContent or embedding to the client
  };
}

export async function createDeck(
  ctx: MutationCtx,
  userId: Id<"users">,
  data: DeckInType,
): Promise<Id<"decks">> {
  const title = data.title || "";
  const description = data.description || "";
  const tags = data.tags || [];
  const searchableContent = `${title.trim()} ${description.trim()} ${tags.join(" ").trim()}`;

  const deckId = await ctx.db.insert("decks", {
    ...data,
    cardCount: 0,
    userId,
    searchableContent,
  });

  return deckId;
}

export async function updateDeck(
  ctx: MutationCtx,
  deckId: Id<"decks">,
  data: DeckUpdateType,
): Promise<void> {
  const deck = await getDeckById(ctx, deckId);
  const title = data.title || deck.title;
  const description = data.description || deck.description || "";
  const tags = data.tags || deck.tags || [];
  const searchableContent = `${title.trim()} ${description.trim()} ${tags.join(" ").trim()}`;

  await ctx.db.patch(deckId, {
    ...data,
    searchableContent,
  });
}

export async function deleteDeck(
  ctx: MutationCtx,
  deckId: Id<"decks">,
): Promise<void> {
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

// Delete a deck and all its cards.
export async function deleteDeckWithCascade(
  ctx: MutationCtx,
  deckId: Id<"decks">,
): Promise<void> {
  await removeAllCardsInDeck(ctx, deckId);
  await deleteDeck(ctx, deckId);
}

// Can be used to delete all decks for a user or all decks in the system.
// TODO: This function is not efficient for large datasets. It should be
// changed to batch delete decks over scheduled actions.
export async function deleteAllDecksWithCascade(
  ctx: MutationCtx,
  userId?: Id<"users">,
): Promise<number> {
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
