import { useCallback } from "react";

interface UseSSEStreamOptions<T> {
  onChunk: (data: string, accumulated: string) => void;
  onComplete?: (accumulated: string) => Promise<void>;
  debug?: boolean;
}

export function useSSEStream<T>() {
  const parseRawEvent = useCallback((rawEvent: string, debug = false) => {
    if (debug) console.log("Raw SSE chunk:", rawEvent);

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
      // Single line event (most common)
      data = dataLines[0];
    } else {
      // Multiple lines: join with newline to preserve formatting
      data = dataLines.join("\n");
    }

    if (debug) {
      console.log("Data:", JSON.stringify(data));
    }

    return data;
  }, []);

  const handleStream = useCallback(
    async (
      response: Response,
      { onChunk, onComplete, debug = false }: UseSSEStreamOptions<T>
    ) => {
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const rawEvent = buffer.substring(0, boundary);
          buffer = buffer.substring(boundary + 2);

          const content = parseRawEvent(rawEvent, debug);
          if (content) {
            accumulated += content;
            onChunk(content, accumulated);
          }

          boundary = buffer.indexOf("\n\n");
        }
      }

      if (onComplete) {
        await onComplete(accumulated);
      }
    },
    [parseRawEvent]
  );

  return { handleStream };
}
