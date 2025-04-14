import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useQuery } from "convex/react";

import { CardType } from "@/cards/types/card";

export function useQueryStudyCards(deckId: string) {
  const cards = useQuery(api.studies_queries.getStudyCards, {
    deckId: deckId as Id<"decks">,
  });

  return {
    data: cards as CardType[],
    loading: cards === undefined,
    error: cards === null,
  };
}
