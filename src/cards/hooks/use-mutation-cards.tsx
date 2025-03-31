import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { CreateCardType } from "@/cards/types/card";

export function useMutationCards(deckId: string) {
  const createMutation = useMutation(api.cards_mutations.create);

  const createCard = async (card: CreateCardType): Promise<boolean> => {
    try {
      await createMutation({
        ...card,
        deckId: deckId as Id<"decks">,
      });
      toast.success("Card created successfully");
      return true;
    } catch (error: unknown) {
      toast.error((error as Error).message || "Please try again later");
      return false;
    }
  };

  return {
    add: createCard,
  };
}
