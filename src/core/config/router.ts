import { BASE_URL } from "@/core/config/env";
import { logger } from "@nanostores/logger";
import { createRouter } from "@nanostores/router";

const DEBUG = false;

const pages = {
  home: `/${BASE_URL}/`, // Home page
  login: `/${BASE_URL}/login`, // Sign in page
  demo: `/${BASE_URL}/demo`, // Demo page
};

export type Page = keyof typeof pages;

export type Params = Record<string, string>;

export const $router = createRouter(pages);

if (DEBUG) {
  logger({ $router });
}
