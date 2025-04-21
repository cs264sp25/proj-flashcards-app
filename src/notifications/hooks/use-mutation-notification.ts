import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { UpdateNotificationType } from "@/notifications/types/notification";

export function useMutationNotification(notificationId: string) {
  const updateMutation = useMutation(api.notifications_mutations.update);
  const deleteMutation = useMutation(api.notifications_mutations.remove);

  const editNotification = async (
    notification: UpdateNotificationType,
  ): Promise<boolean> => {
    try {
      await updateMutation({
        ...notification,
        notificationId: notificationId as Id<"notifications">,
      });
      toast.success("Notification updated");
      return true;
    } catch (error) {
      toast.error("Error updating notification", {
        description: (error as Error).message || "Please try again later",
      });
      return false;
    }
  };

  const deleteNotification = async (): Promise<boolean> => {
    try {
      await deleteMutation({
        notificationId: notificationId as Id<"notifications">,
      });
      toast.success("Notification deleted");
      return true;
    } catch (error) {
      toast.error("Error deleting notification", {
        description: (error as Error).message || "Please try again later",
      });
      return false;
    }
  };

  return {
    edit: editNotification,
    delete: deleteNotification,
  };
}
