import { useState } from "react";
import { ArrowDown01, ArrowDown10 } from "lucide-react";
import { SortOrderType } from "convex/shared";

import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import InfiniteScroll from "@/core/components/infinite-scroll";
import { SearchInput } from "@/core/components/search-input";
import { TooltipButton } from "@/core/components/tooltip-button";

import Chat from "@/chats/components/chat";
import { useQueryChats } from "@/chats/hooks/use-query-chats";

const ChatList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<SortOrderType>("desc");

  const {
    data: chats,
    loading,
    error,
    status,
    loadMore,
  } = useQueryChats(searchTerm, sort);

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
        <SearchInput
          onSearch={setSearchTerm}
          placeholder="Search chats"
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
