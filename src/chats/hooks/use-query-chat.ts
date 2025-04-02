import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useQuery } from "convex/react";

import { ChatType } from "@/chats/types/chat";

export function useQueryChat(chatId: string) {
  const chat = useQuery(api.chats_queries.getOne, {
    chatId: chatId as Id<"chats">,
  });

  return {
    data: chat as ChatType,
    loading: chat === undefined,
    error: chat === null,
  };
}
