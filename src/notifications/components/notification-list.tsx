import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import InfiniteScroll from "@/core/components/infinite-scroll";

import Notification from "@/notifications/components/notification";
import { useQueryNotifications } from "@/notifications/hooks/use-query-notifications";

const NotificationList: React.FC = () => {
  const {
    data: notifications,
    loading,
    error,
    status,
    loadMore,
  } = useQueryNotifications();

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Empty message="Error loading notifications" />;
  }

  if (notifications.length === 0) {
    return <Empty message="No notifications found!" />;
  }

  return (
    <InfiniteScroll
      loadMore={loadMore}
      hasMore={status === "CanLoadMore"}
      isLoading={status === "LoadingMore"}
      className="flex flex-col gap-2"
      aria-label="Notification list"
    >
      {notifications.map(
        ({ _id, title, description, is_read, _creationTime }) => (
          <div key={_id} role="listitem">
            <Notification
              _id={_id}
              title={title}
              description={description}
              is_read={is_read}
              _creationTime={_creationTime}
            />
          </div>
        ),
      )}
    </InfiniteScroll>
  );
};

export default NotificationList;
