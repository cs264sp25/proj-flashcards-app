import { useEffect, useState } from "react";
import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { usePaginatedQuery } from "convex/react";

import { MessageType } from "@/messages/types/message";

const INITIAL_NUM_ITEMS = 20;
const LOAD_MORE_NUM_ITEMS = 10;

export function useQueryMessages(
  chatId: string,
  initialNumItems: number = INITIAL_NUM_ITEMS,
  loadMoreNumItems: number = LOAD_MORE_NUM_ITEMS,
) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const { results, status, loadMore } = usePaginatedQuery(
    api.messages_queries.getAll,
    {
      chatId: chatId as Id<"chats">,
    },
    {
      initialNumItems,
    },
  );

  useEffect(() => {
    if (results) {
      setMessages([...results.reverse()]);
    }
  }, [results]);

  // We need this to regenerate AI response
  const getMessageBefore = (messageId: string) => {
    const index = messages.findIndex((m) => m._id === messageId);
    if (index === -1) {
      return null;
    }
    return messages[index - 1];
  };

  return {
    data: messages,
    loading: status === "LoadingFirstPage",
    error: results === null,
    status,
    loadMore: () => loadMore(loadMoreNumItems),
    getMessageBefore,
  };
}
