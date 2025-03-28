import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";

export function SignIn() {
  const { signIn } = useAuthActions();

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={() => void signIn("github")}>Sign in with GitHub</Button>
      <Button onClick={() => void signIn("google")}>Sign in with Google</Button>
    </div>
  );
}
