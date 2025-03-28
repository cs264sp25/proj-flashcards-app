import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
import { CONVEX_URL } from "./env";

const client = new ConvexHttpClient(CONVEX_URL);

client.action(api.hello.greet).then(console.log);