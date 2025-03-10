/******************************************************************************
 * COVEX AUTH CONFIGURATION
 *
 * Configure the Convex Auth library.
 * Returns an object with functions and auth helper.
 *
 * Note: This configuration must be placed in root-level auth.ts file
 * (i.e., `convex/auth.ts`).
 ******************************************************************************/
import GitHub from "@auth/core/providers/github";
import { convexAuth } from "@convex-dev/auth/server";
 
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub],
});