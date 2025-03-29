import { useState } from "react";
import { ArrowDown01, ArrowDown10 } from "lucide-react";
import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import InfiniteScroll from "@/core/components/infinite-scroll";

import Chat from "@/chats/components/chat";
import { useQueryChats } from "@/chats/hooks/use-query-chats";
import { Input } from "@/core/components/input";
import { TooltipButton } from "@/core/components/tooltip-button";
import { SortOrderType } from "convex/shared";

const ChatList: React.FC = () => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrderType>("desc");
  const { data: chats, loading, error, status, loadMore } = useQueryChats(sort);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Empty message="Error loading chats" />;
  }

  if (chats.length === 0) {
    return <Empty message="No chats found. Create one to get started!" />;
  }

  const handleSort = () => {
    setSort(sort === "asc" ? "desc" : "asc");
  };

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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
        <TooltipButton
          variant="outline"
          size="icon"
          onClick={handleSort}
          tooltipContent="Sort"
        >
          {sort === "asc" ? (
            <ArrowDown01 className="h-4 w-4" />
          ) : (
            <ArrowDown10 className="h-4 w-4" />
          )}
        </TooltipButton>
      </div>
      {chats.map(({ _id, title, description, tags, messageCount }) => (
        <div key={_id} role="listitem">
          <Chat
            _id={_id}
            title={title}
            description={description}
            tags={tags || []}
            messageCount={messageCount || 0}
          />
        </div>
      ))}
    </InfiniteScroll>
  );
};

export default ChatList;
