import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useMutation } from "convex/react";
import { useAuthToken } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { useSSEStream } from "@/core/hooks/use-sse-stream";

import {
  setIsStreaming,
  setStreamingMessageContent,
  clearStreamingMessage,
  setIsThinking,
} from "@/messages/store/streaming-message";
import { UpdateMessageType } from "@/messages/types/message";

const DEBUG = true;

export function useMutationMessage(messageId: string) {
  const updateMutation = useMutation(api.messages_mutations.updateContent);
  const deleteMutation = useMutation(api.messages_mutations.remove);
  const { handleStream } = useSSEStream();
  const token = useAuthToken();

  const editMessageThroughMutation = async (
    message: UpdateMessageType,
    overrideMessageId?: string, // need this for regenerating AI response
  ): Promise<boolean> => {
    try {
      // When we regenerate the AI response, we need to pass the previous message
      // as the differentMessageId
      const whichMessageId = overrideMessageId || messageId;
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

  const editMessageThroughApi = async (
    message: UpdateMessageType,
    overrideMessageId?: string, // need this for regenerating AI response
  ): Promise<void> => {
    try {
      // When we regenerate the AI response, we need to pass the previous message
      // as the differentMessageId
      const whichMessageId = overrideMessageId || messageId;

      const url = `${import.meta.env.VITE_CONVEX_URL.replace(".cloud", ".site")}/api/messages`;
      if (DEBUG) console.log("Making request to:", url);

      const requestBody = {
        content: message.content,
        messageId: whichMessageId as Id<"messages">,
      };

      if (DEBUG) console.log("Request body:", requestBody);

      setIsThinking(true);

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to create message");
      }

      setIsThinking(false);
      setIsStreaming(true);

      let fullResponse = "";
      await handleStream(response, {
        onChunk: (content, accumulated) => {
          fullResponse = accumulated;
          setStreamingMessageContent(fullResponse);
        },
        onComplete: async () => {
          setIsStreaming(false);
          clearStreamingMessage();
        },
        debug: DEBUG,
      });
    } catch (error) {
      toast.error("Error creating message", {
        description: (error as Error).message || "Please try again later",
      });
    }
  };

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
    edit: editMessageThroughApi,
    delete: deleteMessage,
  };
}
