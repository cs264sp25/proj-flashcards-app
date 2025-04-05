import { cn } from "@/core/lib/utils";
import type { z } from "zod";
import { useRouter } from "@/core/hooks/use-router";
import { ScrollArea } from "@/core/components/scroll-area";

import AddDeckForm from "@/decks/components/add-deck-form";
import { createDeckSchema } from "@/decks/types/deck";
import { useMutationDecks } from "@/decks/hooks/use-mutation-decks";

const DEBUG = false;

const AddDeckPage: React.FC = () => {
  const { navigate } = useRouter();
  const { add: createDeck } = useMutationDecks();

  const handleSubmit = async (values: z.infer<typeof createDeckSchema>) => {
    const deckId = await createDeck(values);
    if (deckId) {
      navigate("cards", { deckId });
    }
  };

  const handleCancel = () => {
    navigate("decks");
  };

  return (
    <ScrollArea
      className={cn("p-1 md:p-2 lg:p-4 h-full", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Add New Deck</h2>
      </div>

      <AddDeckForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Create Deck"
      />
    </ScrollArea>
  );
};

export default AddDeckPage;
