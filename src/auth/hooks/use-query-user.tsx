import { useEffect } from "react";
import { api } from "@convex-generated/api";
import { useQuery } from "convex/react";

import { UserType } from "@/auth/types/user";

const DEBUG = false;

export function useQueryUser() {
  const user = useQuery(api.users.getAuthenticatedUser);

  useEffect(() => {
    if (DEBUG) {
      console.log("useQueryUser", user);
    }
  }, [user]);

  return {
    data: user as UserType,
    loading: user === undefined,
    error: user === null,
  };
}
