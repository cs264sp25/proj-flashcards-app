import { Trash } from "lucide-react";
import { cn } from "@/core/lib/utils";
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
import { buttonVariants } from "@/core/components/button-variants";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/core/components/tooltip";

interface DeleteConfirmationProps {
  removeAll: (isRead?: boolean) => Promise<number | null>;
}

const DeleteNotificationsWithConfirmation: React.FC<
  DeleteConfirmationProps
> = ({ removeAll }) => {
  return (
    <Tooltip>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:block">Delete notifications</span>
            </Button>
          </TooltipTrigger>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              How should we delete your notifications?
            </AlertDialogTitle>
            <AlertDialogDescription>
              We can delete the read ones or all of your notifications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await removeAll(true);
              }}
            >
              Read ones
            </AlertDialogAction>
            <AlertDialogAction
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "mb-2 sm:mt-0",
              )}
              onClick={async () => {
                await removeAll();
              }}
            >
              All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <TooltipContent className="sm:hidden">
        <p>Delete notifications</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default DeleteNotificationsWithConfirmation;
