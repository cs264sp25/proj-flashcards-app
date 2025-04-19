import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { UpdateUserType } from "@/auth/types/user";

export function useMutationUser() {
  const generateUploadUrl = useMutation(api.shared.generateUploadUrl);
  const updateMutation = useMutation(api.users_mutations.update);

  const editUserProfile = async (
    userId: string,
    user: UpdateUserType,
  ): Promise<boolean> => {
    try {
      // eslint-disable-next-line
      const { imageFileStorageId, ...rest } = user;
      // You should not change imageFileStorageId here!
      await updateMutation({
        ...rest,
        userId: userId as Id<"users">,
      });
      toast.success("User profile updated");
      return true;
    } catch (error) {
      toast.error("Error updating user profile", {
        description: (error as Error).message || "Please try again later",
      });
      return false;
    }
  };

  const changeProfilePicture = async (
    userId: string,
    image: File,
  ): Promise<boolean> => {
    try {
      // Step 1: Get a short-lived upload URL
      const postUrl = await generateUploadUrl();

      // Step 2: POST the file to the URL
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": image!.type },
        body: image,
      });
      const { storageId } = await result.json();

      // Step 3: Save the uploaded file's storage id to the database
      await updateMutation({
        userId: userId as Id<"users">,
        imageFileStorageId: storageId as Id<"_storage">,
      });

      toast.success("Profile picture updated");
      return true;
    } catch (error) {
      toast.error("Error updating profile picture", {
        description: (error as Error).message || "Please try again later",
      });
      return false;
    }
  };

  return {
    edit: editUserProfile,
    changeProfilePicture,
  };
}
