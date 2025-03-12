import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/core/components/button";
import { LogOut } from "lucide-react";

export function SignOut() {
  const { signOut } = useAuthActions();

  return (
    <Button
      onClick={() => void signOut()}
      variant={"ghost"}
      className="w-full flex justify-start"
    >
      <LogOut className="h-4 w-4" /> Sign out
    </Button>
  );
}
