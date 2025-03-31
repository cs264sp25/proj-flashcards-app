import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { userTables } from "./users_schema";
import { deckTables } from "./decks_schema";
import { cardTables } from "./cards_schema";
import { chatTables } from "./chats_schema";
import { messageTables } from "./messages_schema";

const schema = defineSchema({
  ...authTables,
  ...userTables,
  ...deckTables,
  ...cardTables,
  ...chatTables,
  ...messageTables,
});

export default schema;
