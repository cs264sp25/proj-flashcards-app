import { BASE_URL } from "@/core/config/env";
import { logger } from "@nanostores/logger";
import { createRouter } from "@nanostores/router";

const DEBUG = false;

const pages = {
  home: `/${BASE_URL}/`, // Home page
  login: `/${BASE_URL}/login`, // Sign in page
  demo: `/${BASE_URL}/demo`, // Demo page
  decks: `/${BASE_URL}/decks`, // View all decks
  addDeck: `/${BASE_URL}/decks/add`, // Add a new deck
  deck: `/${BASE_URL}/decks/:deckId`, // View a specific deck (will redirect to cards page)
  editDeck: `/${BASE_URL}/decks/:deckId/edit`, // Edit an existing deck
  cards: `/${BASE_URL}/decks/:deckId/cards`, // View all cards in a specific deck
  addCard: `/${BASE_URL}/decks/:deckId/cards/add`, // Add a new card to a specific deck
  card: `/${BASE_URL}/decks/:deckId/cards/:cardId`, // View a specific card
  editCard: `/${BASE_URL}/decks/:deckId/cards/:cardId/edit`, // Edit a specific card
};

export type Page = keyof typeof pages;

export type Params = {
  deckId?: string;
  cardId?: string;
};

export const $router = createRouter(pages);

if (DEBUG) {
  logger({ $router });
}
