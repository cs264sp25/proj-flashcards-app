/******************************************************************************
 * HTTP ROUTER
 *
 * This is a special file that is used to handle all HTTP routes.
 * Here we are providing a somewhat hacky way to use both Convex Auth and Hono.
 * Hono is used for all routes except auth routes.
 * Auth routes are handled by the Convex Auth library.
 ******************************************************************************/
import { httpRouter, ROUTABLE_HTTP_METHODS } from "convex/server";
import { ActionCtx, httpAction } from "./_generated/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HonoWithConvex } from "convex-helpers/server/hono";

import { chatRoute, completionRoute } from "./openai_handlers";
import { auth } from "./auth";

// Bind ActionCtx to Hono
const app: HonoWithConvex<ActionCtx> = new Hono();
// Now anywhere we have a `c: Context` (from Hono) we can use `ctx: ActionCtx = c.env` to access the Convex ActionCtx

// A simple example of a route that is handled by Hono
app.get("/greeting", async (c) => {
  return c.json({
    message: "Hello, world!",
  });
});

// Middleware to handle CORS for AI routes
app.use("/ai/*", cors());

// Add the AI completion route to the app
app.route("/ai", completionRoute);
app.route("/ai", chatRoute);

// If we only wanted to use Hono, we could now export a http router like this:
// export default new HttpRouterWithHono(app);
// But we want to use the Convex Auth library and rely on the auth.addHttpRoutes() function
// So the following code is a bit of a hack to allow us to use both

// Create a new http router
const http = httpRouter();

// Add the auth routes to the http router
auth.addHttpRoutes(http);
// This provides handler for the following routes:
// - GET /.well-known/openid-configuration
// - GET /.well-known/jwks.json
// - GET /api/auth/signin
// - GET /api/auth/callback/*
// - POST /api/auth/callback/*

// Here is a strategy described in https://stack.convex.dev/hono-with-convex#under-the-hood
// to define a single http action that hands over all requests to Hono
// except for the auth routes, which would be handled by the Convex Auth library
for (const routableMethod of ROUTABLE_HTTP_METHODS) {
  http.route({
    pathPrefix: "/",
    method: routableMethod,
    handler: httpAction(async (ctx, request: Request) => {
      const url = new URL(request.url);
      if (
        url.pathname === "/.well-known/openid-configuration" ||
        url.pathname === "/.well-known/jwks.json" ||
        url.pathname.startsWith("/api/auth/")
      ) {
        // Skip auth routes
        return new Response("Not found", { status: 404 });
      }
      // For all other routes, hand over to Hono
      return await app.fetch(request, ctx);
    }),
  });
}

// We must export a http router from convex/http.ts file
export default http;
