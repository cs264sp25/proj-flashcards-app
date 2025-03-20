import dotenv from "dotenv";

dotenv.config();

export const ANTHROPIC_API_KEY: string = process.env.ANTHROPIC_API_KEY || "";
