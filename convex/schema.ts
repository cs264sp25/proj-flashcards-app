import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
 
const schema = defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    refresh_token_expires_at: v.optional(v.number()),
    // other "users" fields...
  }).index("email", ["email"]),
  // Your other tables...
});
 
export default schema;