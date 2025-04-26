import { HonoWithConvex } from "convex-helpers/server/hono";
import { ActionCtx } from "./_generated/server";
import { Hono } from "hono";

const DEBUG = true;

// Create a new Hono route
export const messagesRoute: HonoWithConvex<ActionCtx> = new Hono();

// Define the route handler
messagesRoute.post("/messages", async (c) => {});

messagesRoute.patch("/messages", async (c) => {});
