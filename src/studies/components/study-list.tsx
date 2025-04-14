import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import InfiniteScroll from "@/core/components/infinite-scroll";

import Study from "@/studies/components/study";
import { useQueryStudies } from "@/studies/hooks/use-query-studies";

const StudyList: React.FC = () => {
  const { data: studies, loading, error, status, loadMore } = useQueryStudies();

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Empty message="Error loading studies" />;
  }

  if (studies.length === 0) {
    return <Empty message="No studies found!" />;
  }

  return (
    <InfiniteScroll
      loadMore={loadMore}
      hasMore={status === "CanLoadMore"}
      isLoading={status === "LoadingMore"}
      className="flex flex-col gap-2"
      aria-label="Study list"
    >
      {studies.map(({ _id, deckId, deckTitle, _creationTime, stats }) => (
        <div key={_id} role="listitem">
          <Study
            _id={_id}
            deckTitle={deckTitle}
            deckId={deckId}
            _creationTime={_creationTime}
            stats={stats}
          />
        </div>
      ))}
    </InfiniteScroll>
  );
};

export default StudyList;
