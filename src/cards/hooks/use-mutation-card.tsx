import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { UpdateCardType } from "@/cards/types/card";

export function useMutationCard(cardId: string) {
  const updateMutation = useMutation(api.cards.update);
  const deleteMutation = useMutation(api.cards.remove);

  const editCard = async (card: UpdateCardType): Promise<boolean> => {
    try {
      await updateMutation({
        ...card,
        cardId: cardId as Id<"cards">,
      });
      toast.success("Card updated successfully");
      return true;
    } catch (error: unknown) {
      toast.error((error as Error).message || "Please try again later");
      return false;
    }
  };

  const deleteCard = async (): Promise<boolean> => {
    try {
      await deleteMutation({
        cardId: cardId as Id<"cards">,
      });
      toast.success("Card deleted successfully");
      return true;
    } catch (error: unknown) {
      toast.error((error as Error).message || "Please try again later");
      return false;
    }
  };

  return {
    edit: editCard,
    delete: deleteCard,
  };
}
