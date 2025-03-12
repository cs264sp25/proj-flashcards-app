import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/core/components/button";
import { GitHubLogo } from "./gitgub-logo";

export function SignIn() {
  const { signIn } = useAuthActions();

  return (
    <Button onClick={() => void signIn("github")}>
      <GitHubLogo className="mr-2 h-4 w-4" /> Login with GitHub
    </Button>
  );
}
