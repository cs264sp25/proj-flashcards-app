import { api } from "@convex-generated/api";
import { useAction, useMutation } from "convex/react";
import { toast } from "sonner";

export function useSpeechToText() {
  const speechToTextAction = useAction(api.openai_voice.speechToText);
  const generateUploadUrl = useMutation(api.shared.generateUploadUrl);

  const convertSpeechToText = async (
    audioFile: File,
  ): Promise<string | null> => {
    try {
      // Step 1: Get a short-lived upload URL
      const postUrl = await generateUploadUrl();

      // Step 2: POST the audio file to the URL
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "audio/mpeg" },
        body: audioFile,
      });

      // Step 3: Get the storage id from the response
      const { storageId } = await result.json();

      // Step 4: Save the uploaded file's storage id to the database
      const text = await speechToTextAction({
        storageId,
      });

      return text;
    } catch (error) {
      toast((error as Error).message || "Please try again later");
      return null;
    }
  };

  return {
    convertSpeechToText,
  };
}
