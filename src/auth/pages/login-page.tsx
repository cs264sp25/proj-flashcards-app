import { useEffect, useState } from "react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "@/core/hooks/use-router";
import { cn } from "@/core/lib/utils";
import Loading from "@/core/components/loading";
import { SignIn } from "@/auth/components/sign-in";
import { SignUp } from "@/auth/components/sign-up";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/core/components/tabs";

const DEBUG = false;

const LoginPage = () => {
  const { redirect } = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const [activeTab, setActiveTab] = useState("signin");

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
        "flex flex-col items-center justify-center min-h-screen gap-6 p-4",
        {
          "border-2 border-red-500": DEBUG,
        },
      )}
    >
      <div className="text-center space-y-2">
        <h1
          className={cn("text-4xl font-bold tracking-tight", {
            "border-2 border-blue-500": DEBUG,
          })}
        >
          Flashcards App
        </h1>
        <p
          className={cn("text-lg text-muted-foreground max-w-md", {
            "border-2 border-green-500": DEBUG,
          })}
        >
          AI-powered flashcards to help you learn anything.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full max-w-md"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin" className="mt-6">
          <SignIn />
        </TabsContent>
        <TabsContent value="signup" className="mt-6">
          <SignUp />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoginPage;
