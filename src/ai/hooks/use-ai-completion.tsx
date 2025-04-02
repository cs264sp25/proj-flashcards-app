import { useState, useCallback } from "react";
import { Task } from "@/ai/types/tasks";

const DEBUG = true;

interface UseAiCompletionReturn {
  completion: string;
  isLoading: boolean;
  error: Error | null;
  generateCompletion: (input: string, task: Task) => Promise<void>;
}

export function useAiCompletion(): UseAiCompletionReturn {
  const [completion, setCompletion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const generateCompletion = useCallback(async (input: string, task: Task) => {
    if (DEBUG) console.log("Starting completion request with:", { input, task });
    setIsLoading(true);
    setError(null);
    setCompletion("");

    try {
      const url = `${import.meta.env.VITE_CONVEX_URL.replace(".cloud", ".site")}/ai/completion`;
      if (DEBUG) console.log("Making request to:", url);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: input, task }),
      });

      if (DEBUG) {
        console.log("Response status:", response.status);
        console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      if (DEBUG) console.log("Got reader, starting to read stream");
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (DEBUG) console.log("Read chunk:", { done, valueLength: value?.length });
        
        if (done) {
          if (DEBUG) console.log("Stream complete");
          break;
        }

        const chunk = decoder.decode(value);
        if (DEBUG) console.log("Decoded chunk:", chunk);
        
        const lines = chunk.split("\n");
        if (DEBUG) console.log("Split into lines:", lines);

        for (const line of lines) {
          // Skip empty lines
          if (!line.trim()) continue;

          // Handle different message types
          if (line.startsWith("0:")) {
            // This is a content chunk
            try {
              const content = JSON.parse(line.slice(2));
              if (DEBUG) console.log("New content:", content);
              accumulatedText += content;
              if (DEBUG) console.log("Updated accumulated text:", accumulatedText);
              setCompletion(accumulatedText);
            } catch (e) {
              if (DEBUG) console.error("Error parsing content chunk:", e);
            }
          } else if (line.startsWith("f:")) {
            // This is a function call message, we can ignore it
            if (DEBUG) console.log("Function call message:", line);
          } else if (line.startsWith("e:") || line.startsWith("d:")) {
            // These are end messages, we can ignore them
            if (DEBUG) console.log("End message:", line);
          }
        }
      }
    } catch (err) {
      if (DEBUG) console.error("Error in generateCompletion:", err);
      setError(err instanceof Error ? err : new Error("An error occurred"));
    } finally {
      if (DEBUG) console.log("Request complete");
      setIsLoading(false);
    }
  }, []);

  return {
    completion,
    isLoading,
    error,
    generateCompletion,
  };
}
