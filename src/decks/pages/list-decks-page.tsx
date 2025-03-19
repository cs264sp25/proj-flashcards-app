import { cn } from "@/core/lib/utils";
import { ScrollArea } from "@/core/components/scroll-area";
import { useRouter } from "@/core/hooks/use-router";
import { Button } from "@/core/components/button";
import { PlusCircle } from "lucide-react";

import DeckList from "@/decks/components/deck-list";

const DEBUG = false;

const ListDecksPage: React.FC = () => {
  const { navigate } = useRouter();

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
          Decks
        </h2>
        <Button variant="outline" size="sm" onClick={() => navigate("addDeck")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Deck
        </Button>
      </div>
      <DeckList />
    </ScrollArea>
  );
};

export default ListDecksPage;
