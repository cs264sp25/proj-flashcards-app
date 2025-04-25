import { useState, useCallback } from "react";
import { Task } from "@/ai/types/tasks";
import { useAuthToken } from "@convex-dev/auth/react";
import { useSSEStream } from "@/core/hooks/use-sse-stream";

const DEBUG = false;

interface UseAiCompletionReturn {
  isLoading: boolean;
  error: Error | null;
  generateCompletion: (
    text: string,
    task: Task,
    context?: Record<string, string>,
    customPrompt?: string,
  ) => Promise<void>;
}

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

export function useAiCompletion(
  setInput: (value: string) => void,
): UseAiCompletionReturn {
  const token = useAuthToken();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { handleStream } = useSSEStream();

  const generateCompletion = useCallback(
    async (
      text: string,
      task: Task,
      context?: Record<string, string>,
      customPrompt?: string,
    ) => {
      if (DEBUG)
        console.log("Starting completion request with:", {
          text,
          task,
          context,
          customPrompt,
        });
      setIsLoading(true);
      setError(null);

      try {
        const url = `${import.meta.env.VITE_CONVEX_URL.replace(".cloud", ".site")}/ai/tasks/completions`;
        if (DEBUG) console.log("Making request to:", url);

        const requestBody = {
          text,
          task,
          context: context || undefined,
          customPrompt: task === "custom" ? customPrompt : undefined,
        };

        if (DEBUG) console.log("Request body:", requestBody);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (DEBUG) {
          console.log("Response status:", response.status);
          console.log(
            "Response headers:",
            Object.fromEntries(response.headers.entries()),
          );
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        await handleStream(response, {
          onChunk: (content, accumulated) => {
            setInput(accumulated);
          },
          debug: DEBUG,
        });
      } catch (err) {
        if (DEBUG) console.error("Error in generateCompletion:", err);
        setError(err instanceof Error ? err : new Error("An error occurred"));
      } finally {
        if (DEBUG) console.log("Request complete");
        setIsLoading(false);
      }
    },
    [setInput, token, handleStream],
  );

  return {
    isLoading,
    error,
    generateCompletion,
  };
}
