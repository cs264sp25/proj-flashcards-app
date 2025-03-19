import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { UpdateDeckType } from "@/decks/types/deck";

export function useMutationDeck(deckId: string) {
  const updateMutation = useMutation(api.decks.update);
  const deleteMutation = useMutation(api.decks.remove);

  const editDeck = async (deck: UpdateDeckType): Promise<boolean> => {
    try {
      await updateMutation({
        ...deck,
        deckId: deckId as Id<"decks">,
      });
      toast.success("Deck updated successfully");
      return true;
    } catch (error) {
      toast.error((error as Error).message || "Please try again later");
      return false;
    }
  };

  const deleteDeck = async (): Promise<boolean> => {
    try {
      await deleteMutation({
        deckId: deckId as Id<"decks">,
      });
      toast.success("Deck deleted successfully");
      return true;
    } catch (error) {
      toast.error((error as Error).message || "Please try again later");
      return false;
    }
  };

  return {
    edit: editDeck,
    delete: deleteDeck,
  };
}
