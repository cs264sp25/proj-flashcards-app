/******************************************************************************
 * COVEX AUTH CONFIGURATION
 *
 * Configure the Convex Auth library.
 * Returns an object with functions and auth helper.
 *
 * Note: This configuration must be placed in root-level auth.ts file
 * (i.e., `convex/auth.ts`).
 ******************************************************************************/
import { MutationCtx } from "./_generated/server";
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { ConvexError } from "convex/values";
import { INVALID_PASSWORD } from "./errors";

const DEBUG = false;

// TODO: We need to have a good way of handilg all sort of issues with auth
//       and errors. (E.g., email already in use, password too weak, etc.)

// TODO: Features to add:
// - [ ] Verify email address
// - [ ] Reset password
// - [ ] Change password
// - [ ] Delete account

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub,
    Password({
      profile(params, _ctx) {
        return {
          name: params.name as string,
          email: params.email as string,
        };
      },
      validatePasswordRequirements: (password: string) => {
        // Must set this variable to true in the Cloud Dev dashboard
        const isDev = process.env.CONVEX_CLOUD_DEV;

        if (DEBUG) {
          console.log("Is development environment:", isDev);
        }

        if (isDev) {
          // In dev mode, we don't want to enforce any password requirements
          return;
        }

        if (
          !password ||
          password.length < 6 ||
          !/\d/.test(password) ||
          !/[a-z]/.test(password) ||
          !/[A-Z]/.test(password)
        ) {
          throw new ConvexError(INVALID_PASSWORD);
        }
      },
    }),
    Google({
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: "https://www.googleapis.com/auth/calendar.events openid",
        },
      },
      profile(profile, tokens) {
        const refresh_token_expires_at =
          Math.floor(Date.now() / 1000) +
          Number(tokens.refresh_token_expires_in);

        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          refresh_token_expires_at,
        };
      },
    }),
  ],
  callbacks: {
    // `args` are the same the as for `createOrUpdateUser` but include `userId`
    async afterUserCreatedOrUpdated(ctx: MutationCtx, { userId }) {
      if (DEBUG) {
        console.log("User created or updated", userId);
      }
    },
  },
});
