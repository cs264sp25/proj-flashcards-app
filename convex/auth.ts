import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { MutationCtx } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub,
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
          refresh_token_expires_at
        };
      },
    }),
  ],
  callbacks: {
    // `args` are the same the as for `createOrUpdateUser` but include `userId`
    async afterUserCreatedOrUpdated(ctx: MutationCtx, { userId }) {
      console.log("User created or updated", userId);
    },
  },
});
