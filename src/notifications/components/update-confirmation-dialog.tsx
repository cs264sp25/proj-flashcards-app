import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/core/components/alert-dialog";
import { Button } from "@/core/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/core/components/tooltip";
import { MailOpen } from "lucide-react";

interface UpdateConfirmationProps {
  updateAll: () => Promise<number | null>;
}

const UpdateNotificationsReadStatus: React.FC<UpdateConfirmationProps> = ({
  updateAll,
}) => {
  return (
    <Tooltip>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              <MailOpen className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:block">Mark all as read</span>
            </Button>
          </TooltipTrigger>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark all notifications as read.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await updateAll();
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <TooltipContent className="sm:hidden">
        <p>Mark all as read</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default UpdateNotificationsReadStatus;
