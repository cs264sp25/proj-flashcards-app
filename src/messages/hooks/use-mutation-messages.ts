import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { CreateMessageType } from "@/messages/types/message";

export function useMutationMessages(chatId: string) {
  const createMutation = useMutation(api.messages_mutations.create);

  const createMessage = async (
    message: CreateMessageType,
  ): Promise<string | null> => {
    try {
      const { userMessageId } = await createMutation({
        content: message.content,
        chatId: chatId as Id<"chats">,
      });
      // toast.success("Message created successfully");
      // ☝️ Does not create a nice UX so we don't use it
      return userMessageId as string;
    } catch (error) {
      toast.error("Error creating message", {
        description: (error as Error).message || "Please try again later",
      });
      return null;
    }
  };

  return {
    add: createMessage,
  };
}
