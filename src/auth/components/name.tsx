import { useEffect, useState } from "react";

import { UserType } from "@/auth/types/user";
import { Input } from "@/core/components/input";
import { Label } from "@/core/components/label";
import { useMutationUser } from "@/auth/hooks/use-mutation-user";

const Name: React.FC<{ user: UserType }> = ({ user }) => {
  const [name, setName] = useState("");
  const { edit: editProfile } = useMutationUser();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
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
    setName(event.target.value);
  };

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter" && name !== user.displayName) {
      // Save the display name
      setIsSaving(true);
      const success = await editProfile(user._id, {
        name,
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
        Name{" "}
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
          value={name}
          onChange={handleChangeDisplayName}
          onKeyDown={handleKeyDown}
        />
      )}
    </div>
  );
};

export default Name;
