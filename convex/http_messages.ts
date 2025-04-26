import { HonoWithConvex } from "convex-helpers/server/hono";
import { ActionCtx } from "./_generated/server";
import { Hono } from "hono";
import { createMiddleware } from 'hono/factory'
import { getUserId } from "./http_helpers";

const DEBUG = true;

type WithVariables<T, V extends object> = 
  T extends Hono<infer E> 
    ? Hono<{
        Bindings: E['Bindings']; // keep the same bindings
        Variables: V;            // add new variables
      }>
    : never;                     // if T is not Hono, return never

type HonoWithConvexExtended = WithVariables<HonoWithConvex<ActionCtx>, { userId: string }>

// Create a new Hono route
export const messagesRoute: HonoWithConvexExtended = new Hono();

const authMiddleware = createMiddleware(async (c, next) => {
  // --- Get ActionCtx from Hono Context ---
  const ctx: ActionCtx = c.env;

  // --- Get User ID ---
  const userId = await getUserId(ctx);
  if (!userId) {
    console.error("ERROR: Unable to get user ID");
    return c.json({ error: "Missing or invalid authorization token" }, 401);
  }

  // --- Set User ID in Context ---
  c.set("userId", userId);
  await next();
});

// Define the route handler
messagesRoute.post("/messages", authMiddleware, async (c) => {
  try {
    if (DEBUG) {
      console.log("[POST messages]: Starting messages route");
    }

    // --- Get ActionCtx from Hono Context ---
    const ctx: ActionCtx = c.env;

    // --- Get User ID ---
    const userId = c.get("userId");

  } catch (error) {
    console.error("Error creating message:", error);
    return c.json({ error: "Failed to create message" }, 500);
  }
});

messagesRoute.patch("/messages", authMiddleware, async (c) => {
  try {
    if (DEBUG) {
      console.log("[PATCH messages]: Starting messages route");
    }

    // --- Get ActionCtx from Hono Context ---
    const ctx: ActionCtx = c.env;

    // --- Get User ID ---
    const userId = c.get("userId");

  } catch (error) {
    console.error("Error editing message:", error);
    return c.json({ error: "Failed to edit message" }, 500);
  }
});
