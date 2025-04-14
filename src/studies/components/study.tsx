import { GalleryVerticalEnd, Trash } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { TooltipButton } from "@/core/components/tooltip-button";
import { TooltipContent, TooltipTrigger } from "@/core/components/tooltip";
import { Tooltip } from "@/core/components/tooltip";
import DeleteConfirmation from "@/core/components/delete-confirmation-dialog";
import { Button } from "@/core/components/button";
import { AlertDialogTrigger } from "@/core/components/alert-dialog";
import { useRouter } from "@/core/hooks/use-router";

import { StudyType } from "@/studies/types/study";
import { useMutationStudy } from "@/studies/hooks/use-mutation-study";
import StudyStatistics from "@/studies/components/study-statistics";

const DEBUG = false;

const Study: React.FC<Partial<StudyType>> = ({
  _id,
  _creationTime,
  deckTitle,
  deckId,
  stats,
}) => {
  const { navigate } = useRouter();
  const { delete: removeStudy } = useMutationStudy(_id as string);

  return (
    <div
      className={cn("w-full border rounded-xl p-2", "hover:bg-secondary", {
        "border-2 border-red-500": DEBUG,
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
            <TooltipButton
              variant={"ghost"}
              size={"icon"}
              tooltipContent="Study this deck"
              onClick={() => navigate("cards", { deckId })}
            >
              <GalleryVerticalEnd className="h-4 w-4" />
            </TooltipButton>
            <Tooltip>
              <DeleteConfirmation
                onDelete={async () => await removeStudy()}
                name="study session"
                trigger={
                  <AlertDialogTrigger asChild>
                    <TooltipTrigger asChild>
                      <Button variant={"ghost"} size={"icon"}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                  </AlertDialogTrigger>
                }
              />
              <TooltipContent>
                <p>Delete study session</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div
          className={cn("p-1", {
            "border-2 border-green-500": DEBUG,
          })}
        >
          {deckTitle}
        </div>
        <div
          className={cn("flex-1 p-1", {
            "border-2 border-green-500": DEBUG,
          })}
        >
          <StudyStatistics {...stats} />
        </div>
      </div>
    </div>
  );
};

export default Study;
