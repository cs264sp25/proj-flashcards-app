import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useQuery } from "convex/react";

import { NotificationType } from "@/notifications/types/notification";

export function useQueryNotification(notificationId: string) {
  const notification = useQuery(api.notifications_queries.getOne, {
    notificationId: notificationId as Id<"notifications">,
  });

  return {
    data: notification as NotificationType,
    loading: notification === undefined,
    error: notification === null,
  };
}
