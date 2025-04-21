import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/core/components/button";
import { GitHubLogo } from "./github-logo";
import { GoogleLogo } from "./google-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/card";
import { Input } from "@/core/components/input";
import { Label } from "@/core/components/label";
import { Separator } from "@/core/components/separator";

export function SignIn() {
  const { signIn } = useAuthActions();

  return (
    <div className="flex items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              void signIn("password", formData);
            }}
            className="space-y-4"
          >
            {/* This is a hidden input that is used to identify the flow of the sign up process */}
            {/* It is required by the Convex Auth Provider */}
            <input name="flow" value={"signIn"} type="hidden" />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => void signIn("github")}
              className="w-full"
            >
              <GitHubLogo className="mr-2 h-4 w-4" />
              Continue with GitHub
            </Button>
            <Button
              variant="outline"
              onClick={() => void signIn("google")}
              className="w-full"
            >
              <GoogleLogo className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
