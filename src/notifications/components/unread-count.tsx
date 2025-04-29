import { useQueryNotifications } from "@/notifications/hooks/use-query-notifications";
import { Badge } from "@/core/components/badge";

const UnreadCount: React.FC = () => {
  const { unreadCount } = useQueryNotifications();

  if (unreadCount === 0) {
    return null;
  }

  return (
    <Badge variant={"secondary"} className="text-xs font-light">
      {unreadCount}
    </Badge>
  );
};

export default UnreadCount;
