import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/core/components/button";
import { GitHubLogo } from "./gitgub-logo";
import { GoogleLogo } from "./google-logo";

export function SignIn() {
  const { signIn } = useAuthActions();

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={() => void signIn("github")}>
        <GitHubLogo className="mr-2 h-4 w-4" /> Login with GitHub
      </Button>
      <Button onClick={() => void signIn("google")}>
        <GoogleLogo className="mr-2 h-4 w-4" /> Login with Google
      </Button>
    </div>
  );
}
