import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import InfiniteScroll from "@/core/components/infinite-scroll";

import Chat from "@/chats/components/chat";
import { useQueryChats } from "@/chats/hooks/use-query-chats";

const ChatList: React.FC = () => {
  const { data: chats, loading, error, status, loadMore } = useQueryChats();

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Empty message="Error loading chats" />;
  }

  if (chats.length === 0) {
    return <Empty message="No chats found. Create one to get started!" />;
  }

  return (
    <InfiniteScroll
      loadMore={loadMore}
      hasMore={status === "CanLoadMore"}
      isLoading={status === "LoadingMore"}
      aria-label="Chat list"
      className="flex flex-col gap-2"
    >
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
