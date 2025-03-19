import { Badge } from "@/core/components/badge";
import { BookOpen, Edit, GalleryVerticalEnd } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { AspectRatio } from "@/core/components/aspect-ratio";
import { Button } from "@/core/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/core/components/tooltip";
import { useRouter } from "@/core/hooks/use-router";

import { DeckType } from "@/decks/types/deck";

const DEBUG = false;

export function Deck({
  _id,
  title,
  description,
  cardCount,
  tags,
}: Partial<DeckType>) {
  const { navigate } = useRouter();

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
            {cardCount}
            {cardCount == 1 ? " card" : " cards"}
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
                  onClick={() => navigate("editDeck", { deckId: _id })}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit deck</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={"ghost"}
                  size={"icon"}
                  onClick={() => navigate("cards", { deckId: _id })}
                >
                  <GalleryVerticalEnd className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show flashcards</p>
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
        <div
          className={cn("p-1", {
            "border-2 border-green-500": DEBUG,
          })}
        >
          {tags?.map((tag, index) => (
            <Badge key={index} className="mr-1 uppercase" variant={"outline"}>
              {tag}
            </Badge>
          ))}
        </div>
        <div
          className={cn("flex items-center  justify-end", {
            "border-2 border-blue-500": DEBUG,
          })}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={"ghost"}
                size={"icon"}
                // onClick={() => navigate("study", { deckId: _id })}
              >
                <BookOpen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Study this deck</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </AspectRatio>
  );
}
