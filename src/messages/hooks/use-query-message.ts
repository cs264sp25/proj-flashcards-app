import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useQuery } from "convex/react";

import { MessageType } from "@/messages/types/message";

export function useQueryMessage(messageId: string) {
  const message = useQuery(api.messages_queries.getOne, {
    messageId: messageId as Id<"messages">,
  });

  return {
    data: message as MessageType,
    loading: message === undefined,
    error: message === null,
  };
}
