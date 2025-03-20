import dotenv from "dotenv";

dotenv.config();

export const DEBUG: boolean = process.env.DEBUG === "true";
