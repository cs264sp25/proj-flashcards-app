import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { userTables } from "./users";
import { deckTables } from "./decks";
import { cardTables } from "./cards";
import { chatTables } from "./chats";
import { messageTables } from "./messages";

const schema = defineSchema({
  ...authTables,
  ...userTables,
  ...deckTables,
  ...cardTables,
  ...chatTables,
  ...messageTables,
});

export default schema;
