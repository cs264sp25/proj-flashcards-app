import { cn } from "@/core/lib/utils";
import { useEffect, useState } from "react";
import { Edit, RotateCcw, RotateCw } from "lucide-react";
import { useRouter } from "@/core/hooks/use-router";
import { Button } from "@/core/components/button";
import { AspectRatio } from "@/core/components/aspect-ratio";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/core/components/tooltip";
import Markdown from "@/core/components/markdown";

import { CardType } from "@/cards/types/card";

const DEBUG = false;

interface CardProps extends Partial<CardType> {
  mode?: "show-front" | "show-back" | "flip";
  isEditable?: boolean;
}

const Card: React.FC<CardProps> = ({
  deckId,
  _id: cardId,
  front,
  back,
  mode = "flip",
  isEditable = true,
}) => {
  const { navigate } = useRouter();
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [content, setContent] = useState<string | undefined>("");

  const handleFlip = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  useEffect(() => {
    setContent(isFlipped ? back : front);
  }, [isFlipped, front, back]);

  useEffect(() => {
    if (mode === "show-front") {
      setIsFlipped(false);
    } else if (mode === "show-back") {
      setIsFlipped(true);
    }
  }, [mode]);

  return (
    <AspectRatio
      ratio={16 / 9}
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
            {isFlipped ? "Back" : "Front"}
          </div>
          <div
            className={cn("flex justify-end", {
              "border-2 border-blue-500": DEBUG,
            })}
          >
            {isEditable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={"ghost"}
                    size={"icon"}
                    onClick={() => navigate("editCard", { deckId, cardId })}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit card</p>
                </TooltipContent>
              </Tooltip>
            )}
            {mode === "flip" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={"ghost"} size={"icon"} onClick={handleFlip}>
                    {!isFlipped ? (
                      <RotateCcw className="h-4 w-4" />
                    ) : (
                      <RotateCw className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Flip card</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        <div
          className={cn("flex-1 p-1", {
            "border-2 border-green-500": DEBUG,
          })}
        >
          <Markdown content={content ?? ""} />
        </div>
      </div>
    </AspectRatio>
  );
};

export default Card;
