import dotenv from "dotenv";

dotenv.config({ path: ".env" }); // Load the first .env file
dotenv.config({ path: "../../.env.local" });

export const DEBUG: boolean = process.env.DEBUG === "true";
export const CONVEX_URL: string = process.env.VITE_CONVEX_URL || "";
export const AUTH_TOKEN: string = process.env.AUTH_TOKEN || "";
