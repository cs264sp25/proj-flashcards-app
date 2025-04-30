/******************************************************************************
 * OPENAI VOICE
 *
 * Actions for text-to-speech and speech-to-text with OpenAI.
 ******************************************************************************/

import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError, v } from "convex/values";

import { openai } from "./openai_helpers";
import { voicesSchema } from "./openai_schema";

/**
 * Text-to-speech
 */
export const textToSpeech = internalAction({
  args: {
    messageId: v.id("messages"),
    text: v.string(),
    voice: voicesSchema,
  },
  handler: async (ctx, args) => {
    const mp3 = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: args.voice,
      input: args.text,
    });

    // Convert the response to a Blob directly
    const blob = new Blob([await mp3.arrayBuffer()], { type: "audio/mpeg" });
    const storageId = await ctx.storage.store(blob);

    // Get the URL for the stored audio
    const audioUrl = await ctx.storage.getUrl(storageId);
    if (!audioUrl) {
      throw new Error("Failed to get URL for stored audio");
    }

    // Update the message with both the storage ID and URL
    await ctx.runMutation(internal.messages_internals.updateMessageAudio, {
      messageId: args.messageId,
      audioStorageId: storageId,
      audioUrl: audioUrl,
    });

    return storageId;
  },
});

/**
 * Speech-to-text
 */
export const speechToText = action({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const blob = await ctx.storage.get(args.storageId);

    if (!blob) {
      throw new ConvexError({
        message: "Failed to get blob for storage ID",
        code: 500,
      });
    }

    // Convert the blob to a File object properly
    const arrayBuffer = await blob.arrayBuffer();
    const file = new File([arrayBuffer], "audio.mp3", { type: "audio/mpeg" });

    // Transcribe the audio file
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1", // Using whisper-1 as it's more reliable for this use case
      language: "en",
      temperature: 0,
    });

    // Trigger an action to delete the audio file from storage after 1 second
    await ctx.scheduler.runAfter(1000, internal.shared.deleteStorageFile, {
      storageId: args.storageId,
    });

    return transcription.text;
  },
});
