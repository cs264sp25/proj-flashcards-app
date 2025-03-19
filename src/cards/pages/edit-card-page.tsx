import type { z } from "zod";
import { cn } from "@/core/lib/utils";
import { Separator } from "@/core/components/separator";
import { ScrollArea } from "@/core/components/scroll-area";
import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import DeleteConfirmation from "@/core/components/delete-confirmation-dialog";
import { useRouter } from "@/core/hooks/use-router";

import CardForm from "@/cards/components/card-form";
import { formSchema } from "@/cards/config/form-config";
import { useMutationCard } from "@/cards/hooks/use-mutation-card";
import { useQueryCard } from "@/cards/hooks/use-query-card";

const DEBUG = false;

interface EditCardPageProps {
  deckId: string;
  cardId: string;
}

const EditCardPage: React.FC<EditCardPageProps> = ({ deckId, cardId }) => {
  const { navigate } = useRouter();
  const { data: card, loading, error } = useQueryCard(cardId);
  const { edit: editCard, delete: deleteCard } = useMutationCard(cardId);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const success = await editCard(values);
    if (success) {
      navigate("cards", { deckId });
    }
  };

  const handleCancel = () => {
    navigate("cards", { deckId });
  };

  const handleDelete = async () => {
    const success = await deleteCard();
    if (success) {
      navigate("cards", { deckId });
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Empty message="Error loading card" />;
  }

  const initialValues = {
    front: card.front,
    back: card.back,
  };

  return (
    <ScrollArea
      className={cn("p-1 md:p-2 lg:p-4 h-full", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Edit Card</h2>
      </div>

      <CardForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        initialValues={initialValues}
        submitLabel="Save Changes"
      />

      <div className="relative my-4">
        <Separator />
        <span className="absolute inset-0 flex justify-center items-center px-2 text-sm">
          Or
        </span>
      </div>

      <div className="flex justify-center p-2">
        <DeleteConfirmation onDelete={handleDelete} name="Card" />
      </div>
    </ScrollArea>
  );
};

export default EditCardPage;
