import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { UpdateChatType } from "@/chats/types/chat";

export function useMutationChat(chatId: string) {
  const updateMutation = useMutation(api.chats_mutations.update);
  const deleteMutation = useMutation(api.chats_mutations.remove);

  const editChat = async (chat: UpdateChatType): Promise<boolean> => {
    try {
      await updateMutation({
        ...chat,
        assistantId: chat.assistantId as Id<"assistants">,
        chatId: chatId as Id<"chats">,
      });
      toast.success("Chat updated successfully");
      return true;
    } catch (error) {
      toast.error("Error updating chat", {
        description: (error as Error).message || "Please try again later",
      });
      return false;
    }
  };

  const deleteChat = async (): Promise<boolean> => {
    try {
      await deleteMutation({
        chatId: chatId as Id<"chats">,
      });
      toast.success("Chat deleted successfully");
      return true;
    } catch (error) {
      toast.error("Error deleting chat", {
        description: (error as Error).message || "Please try again later",
      });
      return false;
    }
  };

  return {
    edit: editChat,
    delete: deleteChat,
  };
}
