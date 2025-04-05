import { cn } from "@/core/lib/utils";
import type { z } from "zod";
import { useRouter } from "@/core/hooks/use-router";
import { ScrollArea } from "@/core/components/scroll-area";

import AddCardForm from "@/cards/components/add-card-form";
import { createCardSchema } from "@/cards/types/card";
import { useMutationCards } from "@/cards/hooks/use-mutation-cards";

const DEBUG = false;

interface AddCardPageProps {
  deckId: string;
}

const AddCardPage: React.FC<AddCardPageProps> = ({ deckId }) => {
  const { navigate } = useRouter();
  const { add: createCard } = useMutationCards(deckId);

  const handleSubmit = async (values: z.infer<typeof createCardSchema>) => {
    const success = await createCard(values);
    if (success) {
      navigate("cards", { deckId });
    }
  };

  const handleCancel = () => {
    navigate("cards", { deckId });
  };

  return (
    <ScrollArea
      className={cn("p-1 md:p-2 lg:p-4 h-full", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Add New Card</h2>
      </div>

      <AddCardForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Create Card"
      />
    </ScrollArea>
  );
};

export default AddCardPage;
