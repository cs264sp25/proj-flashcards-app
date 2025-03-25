import dotenv from "dotenv";

dotenv.config();

export const GEMINI_API_KEY: string = process.env.GEMINI_API_KEY || "";
export const NOTES_DIRECTORY: string = process.env.NOTES_DIRECTORY || "";