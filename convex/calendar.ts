import { action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getAccessToken = internalQuery({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new ConvexError({
        message: "Not authenticated",
        code: 401,
      });
    }

    const user = await ctx.db.get(userId);

    if (!user) {
      throw new ConvexError({
        message: `User ${userId} not found`,
        code: 404,
      });
    }

    const accessToken = user.accessToken;

    if (!accessToken) {
      throw new ConvexError({
        message: "User has no access token",
        code: 401,
      });
    }

    return accessToken;
  },
});

export const getThisWeeksEvents = action({
  args: {},
  handler: async (ctx, args) => {
    const accessToken: string = await ctx.runQuery(
      internal.calendar.getAccessToken,
      {},
    );

    console.log("accessToken", accessToken);

    // Check if token is expired and refresh if needed
    // (Implementation omitted for brevity but would go here)

    // Get the start and end of the current week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);

    // Call the Google Calendar API
    // @ts-ignore
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfWeek.toISOString()}&timeMax=${endOfWeek.toISOString()}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    console.log("calendarResponse", calendarResponse);

    if (!calendarResponse.ok) {
      throw new ConvexError({
        message: "Failed to fetch calendar events",
        code: calendarResponse.status,
      });
    }

    // @ts-ignore
    const calendarData = await calendarResponse.json();

    return {
      events: calendarData.items,
    };
  },
});
