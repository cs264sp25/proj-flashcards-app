import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useAuthToken } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { setIsStreaming, setStreamingMessageContent, clearStreamingMessage, setIsThinking } from "@/messages/store/streaming-message";

import { CreateMessageType } from "@/messages/types/message";

const DEBUG = false;

export function useMutationMessages(chatId: string) {
  const token = useAuthToken();
  const createMutation = useMutation(api.messages_mutations.create);

  const createMessage = async (
    message: CreateMessageType,
  ): Promise<void> => {
    try {
      const userMessageId = await createMutation({
        content: message.content,
        chatId: chatId as Id<"chats">,
        role: "user",
      });

      const url = `${import.meta.env.VITE_CONVEX_URL.replace(".cloud", ".site")}/ai/chat`;
      if (DEBUG) console.log("Making request to:", url);

      // Construct the request body according to the updated backend expectations
      const requestBody = {
        messageId: userMessageId,
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

      // Handle the streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      // Accumulate the response chunks
      let fullResponse = "";
      let isDone = false;

      setIsThinking(false);
      setIsStreaming(true);
      setStreamingMessageContent("Generating response...");

      // Process the stream
      while (!isDone) {
        const { value, done } = await reader.read();
        if (done) break;

        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value);
        if (DEBUG) console.log("Received chunk:", chunk);

        // Split the chunk by newlines to handle multiple SSE events
        const lines = chunk.split("\n");
        for (const line of lines) {
          // Skip empty lines
          if (!line.trim()) continue;

          // Check for special markers
          if (line === "data: [DONE]") {
            isDone = true;
            break;
          }

          if (line.startsWith("data: [ERROR]")) {
            throw new Error(line.slice(13).trim());
          }

          // Extract the actual content after "data: "
          if (line.startsWith("data: ")) {
            const content = line.slice(6); // Remove "data: " prefix
            // Append the content as-is to preserve original formatting
            fullResponse += content;
            setStreamingMessageContent(fullResponse);
          }
        }
      }

      // Create the assistant's message with the complete response
      await createMutation({
        content: fullResponse,
        chatId: chatId as Id<"chats">,
        role: "assistant",
      });

      setIsStreaming(false);
      clearStreamingMessage();
    } catch (error) {
      toast.error("Error creating message", {
        description: (error as Error).message || "Please try again later",
      });
    }
  };

  return {
    add: createMessage,
  };
}
