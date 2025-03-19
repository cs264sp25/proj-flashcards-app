import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useQuery } from "convex/react";

import { CardType } from "@/cards/types/card";

export function useQueryCard(cardId: string) {
  const card = useQuery(api.cards.getOne, {
    cardId: cardId as Id<"cards">,
  });

  return {
    data: card as CardType,
    loading: card === undefined,
    error: card === null,
  };
}
