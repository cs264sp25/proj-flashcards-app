import { api } from "@convex-generated/api";
import { usePaginatedQuery } from "convex/react";
import { SortOrderType } from "convex/shared";

import { ChatType } from "@/chats/types/chat";

const INITIAL_NUM_ITEMS = 5;
const LOAD_MORE_NUM_ITEMS = 5;

export function useQueryChats(
  sortOrder: SortOrderType = "desc",
  initialNumItems: number = INITIAL_NUM_ITEMS,
  loadMoreNumItems: number = LOAD_MORE_NUM_ITEMS,
) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.chats.getAll,
    { sortOrder },
    { initialNumItems },
  );

  return {
    data: results as ChatType[],
    loading: status === "LoadingFirstPage",
    error: results === null,
    status,
    loadMore: () => loadMore(loadMoreNumItems),
  };
}
