import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useAuthToken } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import {
  setIsStreaming,
  setStreamingMessageContent,
  clearStreamingMessage,
  setIsThinking,
} from "@/messages/store/streaming-message";
import { CreateMessageType } from "@/messages/types/message";
import { useSSEStream } from "@/core/hooks/use-sse-stream";

const DEBUG = true;

export function useMutationMessages(chatId: string) {
  const token = useAuthToken();
  const createMutation = useMutation(api.messages_mutations.createUserMessage);
  const { handleStream } = useSSEStream();

  const createMessageThroughMutation = async (
    message: CreateMessageType,
  ): Promise<void> => {
    try {
      await createMutation({
        content: message.content as string,
        chatId: chatId as Id<"chats">,
      });
      toast.success("Message created successfully");
    } catch (error) {
      toast.error("Error creating message", {
        description: (error as Error).message || "Please try again later",
      });
    }
  };

  const createMessageThroughApi = async (
    message: CreateMessageType,
  ): Promise<void> => {
    try {
      const url = `${import.meta.env.VITE_CONVEX_URL.replace(".cloud", ".site")}/api/messages`;
      if (DEBUG) console.log("Making request to:", url);

      const requestBody = {
        content: message.content,
        chatId: chatId as Id<"chats">,
      };

      if (DEBUG) console.log("Request body:", requestBody);

      setIsThinking(true);

      const response = await fetch(url, {
        method: "POST",
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

  return {
    add: createMessageThroughApi,
  };
}
