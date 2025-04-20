import { cn } from "@/core/lib/utils";
import { ScrollArea } from "@/core/components/scroll-area";

import NotificationList from "@/notifications/components/notification-list";
import { useMutationNotifications } from "@/notifications/hooks/use-mutation-notifications";
import DeleteNotificationsWithConfirmation from "@/notifications/components/delete-confirmation-dialog";
import UpdateNotificationsReadStatus from "@/notifications/components/update-confirmation-dialog";

const DEBUG = false;

const ListNotificationsPage: React.FC = () => {
  const { updateAll, removeAll } = useMutationNotifications();

  return (
    <ScrollArea
      className={cn("p-1 md:p-2 lg:p-4 h-full", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div
        className={cn("flex items-center justify-between mb-6", {
          "border-2 border-blue-500": DEBUG,
        })}
      >
        <h2
          className={cn("text-2xl font-bold", {
            "border-2 border-green-500": DEBUG,
          })}
        >
          Notifications
        </h2>
        <div className="space-x-2">
          <UpdateNotificationsReadStatus updateAll={updateAll} />
          <DeleteNotificationsWithConfirmation removeAll={removeAll} />
        </div>
      </div>
      <NotificationList />
    </ScrollArea>
  );
};

export default ListNotificationsPage;
