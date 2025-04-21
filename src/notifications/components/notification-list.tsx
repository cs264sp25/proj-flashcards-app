import { useState } from "react";
import { ArrowDown01, ArrowDown10 } from "lucide-react";
import { SortOrderType } from "convex/shared";

import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import InfiniteScroll from "@/core/components/infinite-scroll";
import { SearchInput } from "@/core/components/search-input";
import { TooltipButton } from "@/core/components/tooltip-button";
import { ScrollArea } from "@/core/components/scroll-area";

import Notification from "@/notifications/components/notification";
import { useQueryNotifications } from "@/notifications/hooks/use-query-notifications";

const NotificationList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<SortOrderType>("desc");

  const {
    data: notifications,
    loading,
    error,
    status,
    loadMore,
  } = useQueryNotifications(searchTerm, sort);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none mb-4">
        <div className="flex items-center gap-2">
          <SearchInput
            onSearch={setSearchTerm}
            placeholder="Search notifications"
            className="flex-1"
          />
          <TooltipButton
            variant="outline"
            size="icon"
            onClick={() => setSort(sort === "asc" ? "desc" : "asc")}
            tooltipContent="Sort"
          >
            {sort === "asc" ? (
              <ArrowDown01 className="h-4 w-4" />
            ) : (
              <ArrowDown10 className="h-4 w-4" />
            )}
          </TooltipButton>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <InfiniteScroll
            loadMore={loadMore}
            hasMore={status === "CanLoadMore"}
            isLoading={status === "LoadingMore"}
            className="flex flex-col gap-2"
            aria-label="Notification list"
          >
            {loading ? (
              <Loading />
            ) : error ? (
              <Empty message="Error loading notifications" />
            ) : notifications.length === 0 ? (
              <Empty message="No notifications found!" />
            ) : (
              notifications.map(
                ({ _id, title, description, is_read, _creationTime }) => (
                  <div key={_id} role="listitem">
                    <Notification
                      _id={_id}
                      title={title}
                      description={description}
                      is_read={is_read}
                      _creationTime={_creationTime}
                    />
                  </div>
                ),
              )
            )}
          </InfiniteScroll>
        </ScrollArea>
      </div>
    </div>
  );
};

export default NotificationList;
