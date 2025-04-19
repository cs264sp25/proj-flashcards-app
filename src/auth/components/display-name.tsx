import { useEffect, useState } from "react";

import { UserType } from "@/auth/types/user";
import { Input } from "@/core/components/input";
import { Label } from "@/core/components/label";
import { useMutationUser } from "@/auth/hooks/use-mutation-user";

const DisplayName: React.FC<{ user: UserType }> = ({ user }) => {
  const [displayName, setDisplayName] = useState("");
  const { edit: editProfile } = useMutationUser();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (saved) {
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    }
  }, [saved]);

  const handleChangeDisplayName = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDisplayName(event.target.value);
  };

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter" && displayName !== user.displayName) {
      // Save the display name
      setIsSaving(true);
      const success = await editProfile(user._id, {
        displayName,
      });
      setIsSaving(false);
      setSaved(success);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-light">
        Display Name{" "}
        <span className="text-muted-foreground">
          (Edit and press enter to change)
        </span>
      </Label>
      {isSaving ? (
        <Input value="Saving..." disabled />
      ) : saved ? (
        <Input value="Saved!" disabled />
      ) : (
        <Input
          value={displayName}
          onChange={handleChangeDisplayName}
          onKeyDown={handleKeyDown}
        />
      )}
    </div>
  );
};

export default DisplayName;
