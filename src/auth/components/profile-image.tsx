import { useRef, useState } from "react";
import { Button } from "@/core/components/button";
import { UserType } from "@/auth/types/user";
import { useMutationUser } from "@/auth/hooks/use-mutation-user";
import { Skeleton } from "@/core/components/skeleton";
import { CircleUser } from "lucide-react";

const ProfileImage: React.FC<{ user: UserType }> = ({ user }) => {
  const { changeProfilePicture } = useMutationUser();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleChangeImage = async () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setIsUploading(true);
    const file = event.target.files?.[0];
    if (file) {
      await changeProfilePicture(user._id, file);
    }
    setIsUploading(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="w-32 h-32 flex-shrink-0 md:mx-0 mb-4">
      {isUploading ? (
        <Skeleton className="w-full h-full rounded-lg" />
      ) : user.image ? (
        <img
          src={user.image}
          alt="User profile"
          className="w-full h-full object-cover rounded-lg"
        />
      ) : (
        <CircleUser className="w-full h-full text-muted-foreground" />
      )}
      <Button
        variant="ghost"
        className="w-full my-1 text-xs font-light"
        size="sm"
        onClick={handleChangeImage}
      >
        Change Image
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ProfileImage;
