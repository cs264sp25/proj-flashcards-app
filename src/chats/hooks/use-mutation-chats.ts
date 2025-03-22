import { api } from "@convex-generated/api";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { CreateChatType } from "@/chats/types/chat";

export function useMutationChats() {
  const createMutation = useMutation(api.chats.create);

  const createChat = async (chat: CreateChatType): Promise<string | null> => {
    try {
      const chatId = await createMutation({
        ...chat,
      });
      toast.success("Chat created successfully");
      return chatId;
    } catch (error) {
      toast.error("Error creating chat", {
        description: (error as Error).message || "Please try again later",
      });
      return null;
    }
  };

  return {
    add: createChat,
  };
}
