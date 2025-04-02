import { cn } from "@/core/lib/utils";
import { ScrollArea } from "@/core/components/scroll-area";
import { useRouter } from "@/core/hooks/use-router";
import { Button } from "@/core/components/button";
import { PlusCircle } from "lucide-react";

import DeckList from "@/decks/components/deck-list";

const DEBUG = false;

interface ListDecksPageProps {
  activeDeckId?: string;
}

const ListDecksPage: React.FC<ListDecksPageProps> = ({ activeDeckId }) => {
  const { navigate } = useRouter();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-1 md:p-2 lg:p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Decks
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigate("addDeck")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Deck
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-1 md:p-2 lg:p-4">
            <DeckList activeDeckId={activeDeckId} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ListDecksPage;
