import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { Deck, Flashcard } from "./types";
import { Id } from "../../convex/_generated/dataModel";
import { AUTH_TOKEN } from "./env";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
import { CONVEX_URL } from "./env";

// Get the directory paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptsDir = path.join(__dirname, "..");
const dataDir = path.join(scriptsDir, "data");

// Create Convex client and set the Auth token
const client = new ConvexHttpClient(CONVEX_URL);
client.setAuth(AUTH_TOKEN);

// Read the decks (the json files in the scripts/data folder)
async function readDecks(): Promise<Deck[]> {
  const deckFiles = await fs.readdir(dataDir);
  const decks = await Promise.all(
    deckFiles.map(async (file) => {
      const filePath = path.join(dataDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as Deck;
    })
  );
  return decks;
}

async function createDeck(deck: Deck): Promise<Id<"decks">> {
  const deckId = await client.mutation(api.decks_mutations.create, {
    title: deck.title,
    description: deck.description,
    tags: deck.tags,
  });
  return deckId;
}

async function createCard(
  deckId: Id<"decks">,
  card: Flashcard,
): Promise<Id<"cards">> {
  const cardId = await client.mutation(api.cards_mutations.create, {
    deckId,
    front: card.front,
    back: card.back,
  });
  return cardId;
}

async function seed() {
  const decks: Deck[] = await readDecks();

  for (const deck of decks) {
    const deckId = await createDeck(deck);
    for (const card of deck.flashcards) {
      const cardId = await createCard(deckId, card);
      console.log(`Created card: ${cardId}`);
    }
  }
}

seed();
