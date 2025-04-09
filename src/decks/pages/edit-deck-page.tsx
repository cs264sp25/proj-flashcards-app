import type { z } from "zod";
import { cn } from "@/core/lib/utils";
import { Separator } from "@/core/components/separator";
import { ScrollArea } from "@/core/components/scroll-area";
import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import DeleteConfirmation from "@/core/components/delete-confirmation-dialog";
import { useRouter } from "@/core/hooks/use-router";

import EditDeckForm from "@/decks/components/edit-deck-form";
import { createDeckSchema } from "@/decks/types/deck";
import { useMutationDeck } from "@/decks/hooks/use-mutation-deck";
import { useQueryDeck } from "@/decks/hooks/use-query-deck";

const DEBUG = false;

interface EditDeckPageProps {
  deckId: string;
}

const EditDeckPage: React.FC<EditDeckPageProps> = ({ deckId }) => {
  const { navigate } = useRouter();
  const { data: deck, loading, error } = useQueryDeck(deckId);
  const { edit: editDeck, delete: deleteDeck } = useMutationDeck(deckId);

  const handleSubmit = async (values: z.infer<typeof createDeckSchema>) => {
    const success = await editDeck(values);
    if (success) {
      navigate("decks");
    }
  };

  const handleCancel = () => {
    navigate("decks");
  };

  const handleDelete = async () => {
    const success = await deleteDeck();
    if (success) {
      navigate("decks");
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !deck) {
    return <Empty message="Error loading deck or deck not found" />;
  }

  const initialValues = {
    title: deck.title || "",
    description: deck.description || "",
    tags: deck.tags || [],
  };

  return (
    <ScrollArea
      className={cn("p-1 md:p-2 lg:p-4 h-full", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Edit Deck</h2>
      </div>

      <EditDeckForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        initialValues={initialValues}
        submitLabel="Save Updates"
      />

      <div className="relative my-4">
        <Separator />
        <span className="absolute inset-0 flex justify-center items-center px-2 text-sm">
          Or
        </span>
      </div>

      <div className="flex justify-center p-2">
        <DeleteConfirmation onDelete={handleDelete} name="Deck" />
      </div>
    </ScrollArea>
  );
};

export default EditDeckPage;
