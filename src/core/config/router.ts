import { BASE_URL } from "@/core/config/env";
import { logger } from "@nanostores/logger";
import { createRouter } from "@nanostores/router";

const DEBUG = false;

const pages = {
  home: `/${BASE_URL}/`, // Home page
  login: `/${BASE_URL}/login`, // Sign in page
  account: `/${BASE_URL}/account`, // User account page
  demo: `/${BASE_URL}/demo`, // Demo page
  decks: `/${BASE_URL}/decks`, // View all decks
  addDeck: `/${BASE_URL}/decks/add`, // Add a new deck
  deck: `/${BASE_URL}/decks/:deckId`, // View a specific deck (will redirect to cards page)
  editDeck: `/${BASE_URL}/decks/:deckId/edit`, // Edit an existing deck
  cards: `/${BASE_URL}/decks/:deckId/cards`, // View all cards in a specific deck
  addCard: `/${BASE_URL}/decks/:deckId/cards/add`, // Add a new card to a specific deck
  card: `/${BASE_URL}/decks/:deckId/cards/:cardId`, // View a specific card
  editCard: `/${BASE_URL}/decks/:deckId/cards/:cardId/edit`, // Edit a specific card
  chats: `/${BASE_URL}/chats`, // Chat page
  addChat: `/${BASE_URL}/chats/add`, // Add a new chat
  chat: `/${BASE_URL}/chats/:chatId`, // View a specific chat
  editChat: `/${BASE_URL}/chats/:chatId/edit`, // Edit a specific chat
  messages: `/${BASE_URL}/chats/:chatId/messages`, // View all messages in a specific chat
  assistants: `/${BASE_URL}/assistants`, // Assistants page
  addAssistant: `/${BASE_URL}/assistants/add`, // Add a new assistant
  assistant: `/${BASE_URL}/assistants/:assistantId`, // View a specific assistant
  editAssistant: `/${BASE_URL}/assistants/:assistantId/edit`, // Edit a specific assistant
  studies: `/${BASE_URL}/studies`, // View all studies
  viewStudy: `/${BASE_URL}/studies/:studyId`, // View and interact with a specific study
};

export type Page = keyof typeof pages;

export type Params = {
  deckId?: string;
  cardId?: string;
  chatId?: string;
  assistantId?: string;
  studyId?: string;
};

export const $router = createRouter(pages);

if (DEBUG) {
  logger({ $router });
}
