import axios from "axios";
import {
  OPENAI_DASHBOARD_AUTH_TOKEN,
  OPENAI_DASHBOARD_ORG_ID,
  OPENAI_DASHBOARD_PROJ_ID,
} from "./env";

// Dangerous!
// This will delete all threads in the OpenAI Dashboard
// I should only use this for the organization I'm testing in

export const openai = axios.create({
  baseURL: "https://api.openai.com/v1",
  headers: {
    // I got these headers by opening the network tab in the browser and looking at the request headers
    // when I view the threads in the OpenAI Dashboard <https://platform.openai.com/assistants?tab=threads>
    Authorization: `Bearer ${OPENAI_DASHBOARD_AUTH_TOKEN}`,
    "OpenAI-Beta": "assistants=v2",
    "Content-Type": "application/json",
    "openai-organization": OPENAI_DASHBOARD_ORG_ID,
    "openai-project": OPENAI_DASHBOARD_PROJ_ID,
  },
});

async function getAllThreadIds() {
  let allThreadIds: string[] = [];
  let hasMore = true;
  let after = undefined;

  while (hasMore) {
    const response = await openai.get("/threads", {
      params: after ? { after } : undefined,
    });

    const threads = response.data.data;
    allThreadIds = [
      ...allThreadIds,
      ...threads.map((thread: any) => thread.id),
    ];

    hasMore = response.data.has_more;
    after = response.data.last_id;
  }

  return allThreadIds;
}

async function deleteAllThreads() {
  try {
    console.log("Fetching all thread IDs...");
    const threadIds = await getAllThreadIds();
    console.log(`Found ${threadIds.length} threads to delete`);

    console.log("Deleting threads...");
    const deletePromises = threadIds.map((threadId) =>
      openai.delete(`/threads/${threadId}`),
    );

    const results = await Promise.all(deletePromises);
    console.log(`Successfully deleted ${results.length} threads`);
  } catch (error) {
    console.error("Error deleting threads:", error);
  }
}

// Execute the deletion
await deleteAllThreads();
