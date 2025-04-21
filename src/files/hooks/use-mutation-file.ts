import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { UpdateFileType } from "@/files/types/file";

export function useMutationFile(fileId: string) {
  const updateMutation = useMutation(api.files_mutations.update);
  const deleteMutation = useMutation(api.files_mutations.remove);

  const editFile = async (file: UpdateFileType): Promise<boolean> => {
    try {
      await updateMutation({
        ...file,
        fileId: fileId as Id<"files">,
      });
      toast.success("File updated successfully");
      return true;
    } catch (error) {
      toast.error((error as Error).message || "Please try again later");
      return false;
    }
  };

  const deleteFile = async (): Promise<boolean> => {
    try {
      await deleteMutation({
        fileId: fileId as Id<"files">,
      });
      toast.success("File deleted successfully");
      return true;
    } catch (error) {
      toast.error((error as Error).message || "Please try again later");
      return false;
    }
  };

  return {
    edit: editFile,
    delete: deleteFile,
  };
}
