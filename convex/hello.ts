import { ConvexError } from "convex/values";
import { action } from "./_generated/server";

export const greet = action({
  handler: async (ctx) => {

    const endpoint = process.env.AWS_ENDPOINT || "";

    if (!endpoint) {
      throw new ConvexError({
        message: "AWS_ENDPOINT is not set",
        code: 500,
      });
    }

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return data;
  },
});