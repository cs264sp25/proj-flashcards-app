import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { usePaginatedQuery } from "convex/react";
import { SortOrderType } from "convex/shared";

import { CardType } from "@/cards/types/card";

const INITIAL_NUM_ITEMS = 5;
const LOAD_MORE_NUM_ITEMS = 5;

export function useQueryCards(
  deckId: string,
  searchQuery?: string,
  sortOrder: SortOrderType = "desc",
  initialNumItems: number = INITIAL_NUM_ITEMS,
  loadMoreNumItems: number = LOAD_MORE_NUM_ITEMS,
) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.cards_queries.getAll,
    { deckId: deckId as Id<"decks">, sortOrder, searchQuery },
    { initialNumItems },
  );

  return {
    data: results as CardType[],
    loading: status === "LoadingFirstPage",
    error: results === null,
    status,
    loadMore: () => loadMore(loadMoreNumItems),
  };
}
