import { UserType } from "@/auth/types/user";
import { Input } from "@/core/components/input";
import { Label } from "@/core/components/label";

const Email: React.FC<{ user: UserType }> = ({ user }) => {
  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-light">
        Email <span className="text-muted-foreground">(Read-only)</span>
      </Label>
      <Input value={user.email} disabled />
    </div>
  );
};

export default Email;
