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

const DEBUG = true;

export function useMutationMessages(chatId: string) {
  const token = useAuthToken();
  const createMutation = useMutation(api.messages_mutations.create);

  const parseRawEvent = (rawEvent: string) => {
    if (DEBUG) console.log("Raw SSE chunk:", rawEvent);

    const lines = rawEvent.split("\n");
    const dataLines = [];

    for (const line of lines) {
      if (line === "data: [DONE]") {
        break;
      }

      if (line.startsWith("data: ")) {
        dataLines.push(line.slice(6)); // Remove "data: "
      }
    }

    let data;
    if (dataLines.length === 1) {
      // Single line event (most common): no extra newline
      data = dataLines[0];
    } else {
      // Multiple lines: join with newline to preserve formatting
      data = dataLines.join("\n");
    }

    if (DEBUG) {
      console.log("Data:", JSON.stringify(data));
    }

    return data;
  };

  const createMessage = async (message: CreateMessageType): Promise<void> => {
    try {
      const userMessageId = await createMutation({
        content: message.content,
        chatId: chatId as Id<"chats">,
        role: "user",
      });

      const url = `${import.meta.env.VITE_CONVEX_URL.replace(".cloud", ".site")}/ai/chats/assistants`;
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

      const decoder = new TextDecoder();
      let buffer = "";

      // Accumulate the response chunks
      let fullResponse = "";
      const isDone = false;

      setIsThinking(false);
      setIsStreaming(true);

      // Process the stream
      while (!isDone) {
        const { value, done } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          break;
        }

        // Convert the chunk to text
        buffer += decoder.decode(value, { stream: true });
        if (DEBUG) console.log("Received chunk:", { buffer });

        // Process ALL complete events in the current buffer
        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const rawEvent = buffer.substring(0, boundary);

          // IMPORTANT: remove processed data from buffer
          buffer = buffer.substring(boundary + 2);

          fullResponse += parseRawEvent(rawEvent);
          setStreamingMessageContent(fullResponse);

          boundary = buffer.indexOf("\n\n");
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
