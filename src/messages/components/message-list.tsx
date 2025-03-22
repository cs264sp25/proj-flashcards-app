import { useCallback, useEffect, useRef, useState } from "react";
import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import Message from "@/messages/components/message";
import { useQueryMessages } from "@/messages/hooks/use-query-messages";
import { RotateCw } from "lucide-react";
import { Button } from "@/core/components/button";

interface MessageListProps {
  chatId: string;
}

const LoadingMore = () => (
  <div className="flex justify-center py-4">
    <RotateCw className="w-6 h-6 animate-spin" />
  </div>
);

const MessageList: React.FC<MessageListProps> = ({ chatId }) => {
  const firstMessageId = useRef<string | null>(null);
  const lastMessageId = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTopValue = useRef(0);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const [scrollDirection, setScrollDirection] = useState<"down" | "up" | null>(
    null,
  );

  const {
    data: messages, // array of messages
    loading, // boolean indicating if the messages are being loaded for the first time
    error, // boolean indicating if there's an error loading messages
    status, // "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted"
    loadMore, // function to load more messages; should be called when status is "CanLoadMore"
  } = useQueryMessages(chatId);

  const scrollToMessage = useCallback(
    (
      messageId: string | null,
      block: "start" | "center" | "end" | "nearest" = "end",
    ) => {
      if (!messageId) return;
      const messageElement = document.querySelector(
        `[data-message-id="${messageId}"]`,
      );

      if (messageElement) {
        messageElement.scrollIntoView({
          behavior: "smooth",
          block,
          inline: "nearest",
        });
      }
    },
    [],
  );

  useEffect(
    () => {
      // when messages change, we might want to scroll to the bottom
      if (messages.length <= 0) return;

      // if we never stored the last or first message id, store it
      if (!lastMessageId.current || !firstMessageId.current) {
        lastMessageId.current = messages[messages.length - 1]._id;
        firstMessageId.current = messages[0]._id;
        scrollToMessage(lastMessageId.current);
        return;
      }

      const firstMessage = messages[0];
      const lastMessage = messages[messages.length - 1];

      if (lastMessage._id !== lastMessageId.current) {
        // if the last message is new, scroll to the bottom
        lastMessageId.current = lastMessage._id;
        scrollToMessage(lastMessageId.current);
      } else if (firstMessage._id !== firstMessageId.current) {
        // if the first message is new, user loaded earlier messages
        // scroll so what used to be the first message is still visible
        const oldFirstMessageId = firstMessageId.current;
        firstMessageId.current = firstMessage._id;
        scrollToMessage(oldFirstMessageId, "center");
      } else {
        // if the first and last message are as before, the last message is being
        // updated by the AI, so we should scroll to the bottom
        // unless the user is scrolling up or down
        if (!isUserScrolling.current && scrollDirection !== "up") {
          scrollToMessage(lastMessageId.current);
        }
      }
    },
    // Do not add isUserScrolling or scrollDirection to the dependencies!
    [messages, scrollToMessage],
  );

  const handleLoadMore = () => {
    // for now, we just load more messages
    loadMore();
  };

  // TODO: should we debounce this?
  const handleOnScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Clear existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    isUserScrolling.current = true;

    if (scrollTopValue.current < e.currentTarget.scrollTop) {
      setScrollDirection("down");
    } else {
      setScrollDirection("up");
    }

    scrollTopValue.current = e.currentTarget.scrollTop;

    // Set a new timeout to reset isUserScrolling
    scrollTimeout.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 150); // 150ms
  };

  if (loading) return <Loading />;
  if (error) return <Empty message="Error loading messages" />;
  if (messages.length === 0) return <Empty message="What can I help with?" />;

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto scroll-smooth"
      onScroll={handleOnScroll}
    >
      {status === "CanLoadMore" && (
        <Button
          variant={"outline"}
          size={"sm"}
          onClick={handleLoadMore}
          className="w-full text-xs font-light"
        >
          Load Earlier Messages
        </Button>
      )}
      {status === "LoadingMore" && <LoadingMore />}
      {messages.map((message) => (
        <div key={message._id} data-message-id={message._id}>
          <Message message={message} />
        </div>
      ))}
    </div>
  );
};

export default MessageList;
