import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { UpdateMessageType } from "@/messages/types/message";

export function useMutationMessage(messageId: string) {
  const updateMutation = useMutation(api.messages.update);
  const deleteMutation = useMutation(api.messages.remove);

  const editMessage = async (
    message: UpdateMessageType,
    differentMessageId?: string, // need this for regenerating AI response
  ): Promise<boolean> => {
    try {
      const whichMessageId = differentMessageId || messageId;
      await updateMutation({
        content: message.content as string,
        messageId: whichMessageId as Id<"messages">,
      });
      toast.success("Message updated successfully");
      return true;
    } catch (error) {
      toast.error("Error updating message", {
        description: (error as Error).message || "Please try again later",
      });
      return false;
    }
  };

  // TODO: We may want to remove this feature!
  const deleteMessage = async (): Promise<boolean> => {
    try {
      await deleteMutation({
        messageId: messageId as Id<"messages">,
      });
      toast.success("Message deleted successfully");
      return true;
    } catch (error) {
      toast.error("Error deleting message", {
        description: (error as Error).message || "Please try again later",
      });
      return false;
    }
  };

  return {
    edit: editMessage,
    delete: deleteMessage,
  };
}
