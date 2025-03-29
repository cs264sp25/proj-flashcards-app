import { useState } from "react";
import { ArrowDown01, ArrowDown10 } from "lucide-react";
import { useDebounce } from "@uidotdev/usehooks";
import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import InfiniteScroll from "@/core/components/infinite-scroll";

import Chat from "@/chats/components/chat";
import { useQueryChats } from "@/chats/hooks/use-query-chats";
import { Input } from "@/core/components/input";
import { TooltipButton } from "@/core/components/tooltip-button";
import { SortOrderType } from "convex/shared";

const ChatList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<SortOrderType>("desc");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    data: chats,
    loading,
    error,
    status,
    loadMore,
  } = useQueryChats(debouncedSearchTerm, sort);

  if (error) {
    return <Empty message="Error loading chats" />;
  }

  return (
    <InfiniteScroll
      loadMore={loadMore}
      hasMore={status === "CanLoadMore"}
      isLoading={status === "LoadingMore"}
      aria-label="Chat list"
      className="flex flex-col gap-2"
    >
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
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
      {loading ? (
        <Loading />
      ) : chats.length === 0 ? (
        <Empty message="No chats found. Create one to get started!" />
      ) : (
        chats.map(({ _id, title, description, tags, messageCount }) => (
          <div key={_id} role="listitem">
            <Chat
              _id={_id}
              title={title}
              description={description}
              tags={tags || []}
              messageCount={messageCount || 0}
            />
          </div>
        ))
      )}
    </InfiniteScroll>
  );
};

export default ChatList;
