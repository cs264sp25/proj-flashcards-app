import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { userTables } from "./users";
import { deckTables } from "./decks";
import { cardTables } from "./cards";

const schema = defineSchema({
  ...authTables,
  ...userTables,
  ...deckTables,
  ...cardTables,
});

export default schema;
