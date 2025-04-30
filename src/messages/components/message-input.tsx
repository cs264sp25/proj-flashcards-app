import React, { useState, useRef, useEffect } from "react";
import { Id } from "@convex-generated/dataModel";
import { Button } from "@/core/components/button";
import { Textarea } from "@/core/components/textarea";
import { Mic, Paperclip, Send } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { toast } from "sonner";
import { useStore } from "@nanostores/react";

import AssistantDropdown from "@/assistants/components/assistant-dropdown";
import { useQueryChat } from "@/chats/hooks/use-query-chat";
import { useMutationChat } from "@/chats/hooks/use-mutation-chat";
import { useMutationMessages } from "@/messages/hooks/use-mutation-messages";
import { Label } from "@/core/components/label";
import { $isStreaming, $isThinking } from "@/messages/store/streaming-message";
import { useSpeechToText } from "@/core/hooks/use-speech-to-text";
import { AudioRecordingIndicator } from "@/core/components/audio-recording-indicator";

const DEBUG = false;

interface MessageInputProps {
  chatId: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ chatId }) => {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { add: createMessage } = useMutationMessages(chatId);
  const { data: chat /*, isLoading: isChatLoading */ } = useQueryChat(chatId);
  const { edit: editChat } = useMutationChat(chatId);
  const isThinking = useStore($isThinking);
  const isStreaming = useStore($isStreaming);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { convertSpeechToText } = useSpeechToText();

  // Auto-focus textarea when component mounts
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle textarea auto-resize
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = "auto";
      const maxHeight = window.innerHeight / 3; // 1/3 of viewport height
      const scrollHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${scrollHeight}px`;
    };

    adjustHeight();

    // Add resize event listener to handle viewport changes
    window.addEventListener("resize", adjustHeight);
    return () => window.removeEventListener("resize", adjustHeight);
  }, [text]); // Re-run when text changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() === "") return;

    // Don't await this, we want to continue to set the text to empty
    createMessage({
      role: "user",
      content: text,
    });
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = async () => {
    toast.error("File upload is not implemented");
  };

  const handleVoiceInput = async () => {
    if (!isRecording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/mpeg",
          });
          const audioFile = new File([audioBlob], "audio.mp3", {
            type: "audio/mpeg",
          });
          const transcribedText = await convertSpeechToText(audioFile);
          if (transcribedText) {
            const currentText = text || "";
            setText(currentText.trim() + " " + transcribedText.trim());
          }
          // Clean up
          stream.getTracks().forEach((track) => track.stop());
          setIsRecording(false);
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    } else {
      // Stop recording
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const handleAssistantChange = async (value: Id<"assistants">) => {
    // Only update if chat data is loaded and the assistantId has actually changed
    if (chat && value !== chat.assistantId) {
      const success = await editChat({ assistantId: value });
      if (!success) {
        toast.error("Failed to update assistant");
      }
    } else if (!chat) {
      // Optional: Log if the change was attempted before chat loaded
      console.warn("Assistant change triggered before chat data was loaded.");
    }
  };

  // Determine if the dropdown should be disabled (e.g., while chat is loading)
  const isChatLoading = !chat; // Simple check if chat data is not yet available

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("relative w-full bg-background p-0", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div className="flex flex-col gap-2">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          className={cn(
            "w-full overflow-y-auto",
            "focus-visible:ring-0",
            "border border-input rounded-lg",
            "resize-none",
            "bg-background text-foreground",
            // Updated scrollbar classes to use theme colors
            "scrollbar-thin",
            "scrollbar-thumb-muted scrollbar-thumb-rounded-lg hover:scrollbar-thumb-muted-foreground",
            "scrollbar-track-transparent",
            {
              "border-2 border-yellow-500": DEBUG,
            },
          )}
          rows={3}
        />
        <div
          className={cn(
            "flex items-center justify-between border-t border-input bg-background",
            // "pt-2",
            {
              "border-2 border-blue-500": DEBUG,
            },
          )}
        >
          <div className="flex justify-centeritems-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("hover:bg-accent", {
                "border-2 border-green-500": DEBUG,
              })}
              onClick={handleFileUpload}
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                // "absolute left-4 bottom-3",
                "hover:bg-accent",
                {
                  "bg-red-500/10 hover:bg-red-500/20": isRecording,
                  "border-2 border-green-500": DEBUG,
                },
              )}
              onClick={handleVoiceInput}
            >
              <Mic
                className={cn("h-5 w-5 text-muted-foreground", {
                  "text-red-500": isRecording,
                })}
              />
            </Button>

            <AudioRecordingIndicator isRecording={isRecording} />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Assistant:</Label>
            <AssistantDropdown
              value={chat?.assistantId as Id<"assistants">}
              onChange={handleAssistantChange}
              disabled={isChatLoading || isThinking || isStreaming}
            />
            <Button
              type="submit"
              variant="ghost"
              className={cn(
                "flex items-center gap-2",
                "px-4",
                "hover:bg-accent",
                "disabled:opacity-50",
                {
                  "border-2 border-purple-500": DEBUG,
                },
              )}
              disabled={!text.trim() || isThinking || isStreaming}
            >
              <span className="hidden md:block">Send</span>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default MessageInput;
