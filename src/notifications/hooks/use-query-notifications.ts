import { api } from "@convex-generated/api";
import { usePaginatedQuery, useQuery } from "convex/react";
import { SortOrderType } from "convex/shared";

import { NotificationType } from "@/notifications/types/notification";

const INITIAL_NUM_ITEMS = 5;
const LOAD_MORE_NUM_ITEMS = 5;

export function useQueryNotifications(
  searchQuery: string = "",
  sortOrder: SortOrderType = "desc",
  initialNumItems: number = INITIAL_NUM_ITEMS,
  loadMoreNumItems: number = LOAD_MORE_NUM_ITEMS,
) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.notifications_queries.getAll,
    {
      searchQuery,
      sortOrder,
    },
    { initialNumItems },
  );

  const unreadCount = useQuery(api.notifications_queries.getUnreadCount, {});

  return {
    data: results as NotificationType[],
    loading: status === "LoadingFirstPage",
    error: results === null,
    status,
    loadMore: () => loadMore(loadMoreNumItems),
    unreadCount: unreadCount ?? 0,
  };
}
