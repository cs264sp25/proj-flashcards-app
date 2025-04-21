import { api } from "@convex-generated/api";
import { useMutation } from "convex/react";
import { toast } from "sonner";

export function useMutationNotifications() {
  // user does not create notifications, so there is no create mutation here

  const readAllUnreadMutation = useMutation(
    api.notifications_mutations.readAllUnread,
  );

  const removeAllMutation = useMutation(api.notifications_mutations.removeAll);

  const updateAllNotifications = async (): Promise<number | null> => {
    try {
      const count = await readAllUnreadMutation({});
      toast.success("Notifications updated");
      return count;
    } catch (error) {
      toast.error("Error updating notifications", {
        description: (error as Error).message || "Please try again later",
      });
      return null;
    }
  };

  const deleteAllNotifications = async (
    isRead?: boolean,
  ): Promise<number | null> => {
    try {
      const count = await removeAllMutation({
        isRead,
      });
      toast.success("Notifications deleted");
      return count;
    } catch (error) {
      toast.error("Error deleting notification", {
        description: (error as Error).message || "Please try again later",
      });
      return null;
    }
  };

  return {
    removeAll: deleteAllNotifications,
    updateAll: updateAllNotifications,
  };
}
