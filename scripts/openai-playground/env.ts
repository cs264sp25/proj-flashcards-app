import dotenv from "dotenv";

dotenv.config();

export const OPENAI_API_KEY: string = process.env.OPENAI_API_KEY || "";
export const ACCUWEATHER_API_KEY: string =
  process.env.ACCUWEATHER_API_KEY || "";

export const OPENAI_DASHBOARD_AUTH_TOKEN: string =
  process.env.OPENAI_DASHBOARD_AUTH_TOKEN || "";
export const OPENAI_DASHBOARD_ORG_ID: string =
  process.env.OPENAI_DASHBOARD_ORG_ID || "";
export const OPENAI_DASHBOARD_PROJ_ID: string = process.env.OPENAI_DASHBOARD_PROJ_ID || "";