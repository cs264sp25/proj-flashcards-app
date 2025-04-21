import { cn } from "@/core/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/core/components/tooltip";
import { Mail, MailOpen, X } from "lucide-react";
import { Button } from "@/core/components/button";

import { NotificationType } from "@/notifications/types/notification";
import { useMutationNotification } from "../hooks/use-mutation-notification";

const DEBUG = false;

const Notification: React.FC<Partial<NotificationType>> = ({
  _id,
  title,
  description,
  is_read,
  _creationTime,
}) => {
  const { edit: editNotification, delete: deleteNotification } =
    useMutationNotification(_id as string);

  return (
    <div
      className={cn("w-full border rounded-xl p-2", "hover:bg-secondary", {
        "border-2 border-red-500": DEBUG,
        "border-primary": !is_read,
      })}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between">
          <div
            className={cn("p-1 text-muted-foreground font-light text-sm", {
              "border-2 border-blue-500": DEBUG,
            })}
          >
            {_creationTime &&
              new Date(_creationTime).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "numeric",
              })}
          </div>
          <div
            className={cn("flex justify-end", {
              "border-2 border-blue-500": DEBUG,
            })}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={"ghost"}
                  size={"icon"}
                  onClick={async () =>
                    await editNotification({
                      isRead: !is_read,
                    })
                  }
                >
                  {is_read ? (
                    <MailOpen className="h-4 w-4" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{is_read ? "Mark as unread" : "Mark as read"}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={"ghost"}
                  size={"icon"}
                  onClick={async () => await deleteNotification()}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete notification</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div
          className={cn("p-1", {
            "border-2 border-green-500": DEBUG,
          })}
        >
          {title}
        </div>
        <div
          className={cn("flex-1 p-1 text-muted-foreground", {
            "border-2 border-green-500": DEBUG,
          })}
        >
          {description}
        </div>
      </div>
    </div>
  );
};

export default Notification;
