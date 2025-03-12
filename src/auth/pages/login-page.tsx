import { useEffect } from "react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "@/core/hooks/use-router";
import { cn } from "@/core/lib/utils";
import Loading from "@/core/components/loading";
import { SignIn } from "@/auth/components/sign-in";

const DEBUG = false;

const LoginPage = () => {
  const { redirect } = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();

  useEffect(() => {
    if (isAuthenticated) {
      redirect("home");
    }
  }, [isAuthenticated, redirect]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center h-screen gap-2",
        {
          "border-2 border-red-500": DEBUG,
        },
      )}
    >
      <h1
        className={cn("text-4xl font-bold", {
          "border-2 border-blue-500": DEBUG,
        })}
      >
        Flashcards App
      </h1>
      <p
        className={cn("text-lg text-gray-600 text-center p-2", {
          "border-2 border-green-500": DEBUG,
        })}
      >
        AI-powered flashcards to help you learn anything.
      </p>
      <SignIn />
    </div>
  );
};

export default LoginPage;
