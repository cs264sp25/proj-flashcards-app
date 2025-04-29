import { api } from "@convex-generated/api";
import { usePaginatedQuery } from "convex/react";

import { FileType } from "@/files/types/file";
import { SortOrderType } from "convex/shared";

const INITIAL_NUM_ITEMS = 5;
const LOAD_MORE_NUM_ITEMS = 5;

export function useQueryFiles(
  searchQuery?: string,
  sortOrder: SortOrderType = "desc",
  initialNumItems: number = INITIAL_NUM_ITEMS,
  loadMoreNumItems: number = LOAD_MORE_NUM_ITEMS,
) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.files_queries.getAll,
    { sortOrder, searchQuery },
    { initialNumItems },
  );

  return {
    data: results as unknown as FileType[],
    loading: status === "LoadingFirstPage",
    error: results === null,
    status,
    loadMore: () => loadMore(loadMoreNumItems),
  };
}
