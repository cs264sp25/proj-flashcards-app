import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";

import DisplayName from "@/auth/components/display-name";
import Name from "@/auth/components/name";
import Email from "@/auth/components/email";
import ProfileImage from "@/auth/components/profile-image";
import { useQueryUser } from "@/auth/hooks/use-query-user";

const UserAccountPage: React.FC = () => {
  const { data: user, loading, error } = useQueryUser();

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Empty message="Error loading user" />;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Account</h2>
      <div className="flex flex-col-reverse md:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-2">
          <Name user={user} />
          <Email user={user} />
          <DisplayName user={user} />
        </div>
        <ProfileImage user={user} />
      </div>
    </div>
  );
};

export default UserAccountPage;
