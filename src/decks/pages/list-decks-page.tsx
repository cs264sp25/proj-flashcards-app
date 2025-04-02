import { PlusCircle } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { useRouter } from "@/core/hooks/use-router";
import { Button } from "@/core/components/button";

import DeckList from "@/decks/components/deck-list";

const DEBUG = false;

interface ListDecksPageProps {
  activeDeckId?: string;
}

const ListDecksPage: React.FC<ListDecksPageProps> = ({ activeDeckId }) => {
  const { navigate } = useRouter();

  return (
    <div
      className={cn("flex flex-col h-full", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div
        className={cn("flex-none p-1 md:p-2 lg:p-4", {
          "border-2 border-blue-500": DEBUG,
        })}
      >
        <div
          className={cn("flex items-center justify-between", {
            "border-2 border-yellow-500": DEBUG,
          })}
        >
          <h2 className="text-2xl font-bold">Decks</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("addDeck")}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Deck
          </Button>
        </div>
      </div>
      <div
        className={cn("flex-1 min-h-0 p-1 md:p-2 lg:p-4", {
          "border-2 border-green-500": DEBUG,
        })}
      >
        <DeckList activeDeckId={activeDeckId} />
      </div>
    </div>
  );
};

export default ListDecksPage;
