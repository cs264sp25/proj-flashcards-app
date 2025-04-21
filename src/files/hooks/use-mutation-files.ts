import { api } from "@convex-generated/api";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { CreateFileType } from "@/files/types/file";

export function useMutationFiles() {
  const generateUploadUrl = useMutation(api.shared.generateUploadUrl);
  const createMutation = useMutation(api.files_mutations.create);

  const createFile = async (
    fileMeta: CreateFileType,
  ): Promise<string | null> => {
    try {
      const { file, ...rest } = fileMeta;

      // Step 1: Get a short-lived upload URL
      const postUrl = await generateUploadUrl();

      // Step 2: POST the file to the URL
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file!.type },
        body: file,
      });
      const { storageId } = await result.json();

      // Step 3: Save the uploaded file's storage id to the database
      const fileId = await createMutation({
        ...rest,
        storageId,
      });

      toast.success("File created successfully");
      return fileId;
    } catch (error) {
      toast.error((error as Error).message || "Please try again later");
      return null;
    }
  };

  return {
    add: createFile,
  };
}
