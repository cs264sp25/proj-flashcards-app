import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import InfiniteScroll from "@/core/components/infinite-scroll";

import { Deck } from "./deck";
import { useQueryDecks } from "@/decks/hooks/use-query-decks";

const DeckList: React.FC = () => {
  const { data: decks, loading, error, status, loadMore } = useQueryDecks();

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Empty message="Error loading decks" />;
  }

  if (decks.length === 0) {
    return <Empty message="No decks found. Create one to get started!" />;
  }

  return (
    <InfiniteScroll
      loadMore={loadMore}
      hasMore={status === "CanLoadMore"}
      isLoading={status === "LoadingMore"}
      aria-label="Deck list"
      className="flex flex-col gap-2"
    >
      {decks.map(({ _id, title, description, cardCount, tags }) => (
        <div key={_id} role="listitem">
          <Deck
            _id={_id}
            title={title}
            description={description}
            cardCount={cardCount || 0}
            tags={tags || []}
          />
        </div>
      ))}
    </InfiniteScroll>
  );
};

export default DeckList;
