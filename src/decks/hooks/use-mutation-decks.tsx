import { api } from "@convex-generated/api";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { CreateDeckType } from "@/decks/types/deck";

export function useMutationDecks() {
  const createMutation = useMutation(api.decks.create);

  const createDeck = async (deck: CreateDeckType): Promise<string | null> => {
    try {
      const deckId = await createMutation({
        ...deck,
      });
      toast.success("Deck created successfully");
      return deckId as string;
    } catch (error) {
      toast.error((error as Error).message || "Please try again later");
      return null;
    }
  };

  return {
    add: createDeck,
  };
}
