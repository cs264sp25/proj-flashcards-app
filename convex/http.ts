import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { completion as openaiCompletion } from "./openai_http_actions";
import { ActionCtx, httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/greeting",
  method: "GET",
  handler: httpAction(
    async (ctx: ActionCtx, request: Request): Promise<Response> => {
      return new Response("Hello, world!");
    },
  ),
});

// Pre-flight request for /ai/*
http.route({
  path: "/ai/completion",
  method: "OPTIONS",
  handler: httpAction(async (_, request) => {
    // Make sure the necessary headers are present
    // for this to be a valid pre-flight request
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          // e.g. https://mywebsite.com, configured on your Convex dashboard
          // "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN!,
          "Access-Control-Allow-Origin": "*", // Or allow all origins
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, Digest",
          "Access-Control-Max-Age": "86400",
        }),
      });
    } else {
      return new Response();
    }
  }),
});

http.route({
  path: "/ai/completion",
  method: "POST",
  handler: openaiCompletion,
});

auth.addHttpRoutes(http);

export default http;
