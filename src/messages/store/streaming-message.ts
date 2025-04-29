import { MessageType } from "@/messages/types/message";
import { logger } from "@nanostores/logger";
import { atom, map } from "nanostores";

const DEBUG = false;

const initialStreamingMessage: MessageType = {
  role: "assistant",
  content: "",
  chatId: crypto.randomUUID(),
  _id: crypto.randomUUID(),
  _creationTime: Date.now(),
};

export const $isThinking = atom<boolean>(false);
export const $isStreaming = atom<boolean>(false);
export const $streamingMessage = map<MessageType>(initialStreamingMessage);

export const setIsThinking = (isThinking: boolean) => {
  $isThinking.set(isThinking);
};

export const setIsStreaming = (isStreaming: boolean) => {
  $isStreaming.set(isStreaming);
};

export const setStreamingMessageContent = (content: string) => {
  $streamingMessage.setKey("content", content);
};

export const clearStreamingMessage = () => {
  $streamingMessage.set({
    ...initialStreamingMessage,
    _id: crypto.randomUUID(),
    _creationTime: Date.now(),
  });
};

if (DEBUG) {
  logger({
    $streamingMessage,
    $isStreaming,
    $isThinking,
  });
}
