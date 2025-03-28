# Flashcard Seed

This script seeds the database with sample decks and flashcards.

## Usage

You need to go to the root directory of the project and run the following command:

```bash
npx convex dev
```

After the dev server is started, you can run the script by going to the script directory and running:

```bash
cd scripts/flashcard-seed
pnpm run start
```

This runs `index.ts`, which is a dummy script that prints "Hello, world!" to the console. It's to ensure that the script can connect to the Convex server.

At this point, go back to the root directory and run:

```bash
pnpm run dev
```

This will run the frontend dev server. You should sign into your account. Open the dev tools and go to the Local Storage section. You should see a `__convexAuthJWT` key with a value. Copy that value as the `AUTH_TOKEN` in the `env.ts` file.

Now you can run the seeding script:

```bash
pnpm run seed
```

This will seed the database with sample decks and flashcards. It is assumed the sample data is stored in `scripts/data` folder. Each deck is stored in a separate JSON file.

## Structure

- `seed.ts`: Main script that seeds the database with sample decks and flashcards
- `types.ts`: TypeScript types for flashcards and decks
- `env.ts`: Environment variables (AUTH_TOKEN required)
- `index.ts`: A dummy demo file to test that all dependencies are installed