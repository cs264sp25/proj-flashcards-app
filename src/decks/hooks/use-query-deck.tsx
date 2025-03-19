import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useQuery } from "convex/react";

import { DeckType } from "@/decks/types/deck";

export function useQueryDeck(deckId: string) {
  const deck = useQuery(api.decks.getOne, {
    deckId: deckId as Id<"decks">,
  });

  return {
    data: deck as DeckType,
    loading: deck === undefined,
    error: deck === null,
  };
}
