import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import InfiniteScroll from "@/core/components/infinite-scroll";

import Card from "@/cards/components/card";
import { useQueryCards } from "@/cards/hooks/use-query-cards";

interface CardListProps {
  deckId: string;
}

const CardList: React.FC<CardListProps> = ({ deckId }) => {
  const {
    data: cards,
    loading,
    error,
    status,
    loadMore,
  } = useQueryCards(deckId);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Empty message="Error loading cards" />;
  }

  if (cards.length === 0) {
    return (
      <Empty message="No cards in this deck yet. Add some to get started!" />
    );
  }

  return (
    <InfiniteScroll
      loadMore={loadMore}
      hasMore={status === "CanLoadMore"}
      isLoading={status === "LoadingMore"}
      aria-label="Card list"
      className="flex flex-col gap-2"
    >
      {cards.map((card) => (
        <div key={card._id} role="listitem">
          <Card
            deckId={deckId}
            _id={card._id}
            front={card.front}
            back={card.back}
          />
        </div>
      ))}
    </InfiniteScroll>
  );
};

export default CardList;
