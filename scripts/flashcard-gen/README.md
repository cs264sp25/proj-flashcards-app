# Flashcard Generation

AI-powered script that generates flashcards from markdown files. Each chapter's flashcards are saved as a separate JSON file.

## Usage

You must install the dependencies in this folder, separate from the root dependencies:

```bash
cd scripts/flashcard-gen
pnpm install
```

You should also set the `GEMINI_API_KEY` and `NOTES_DIRECTORY` environment variables in the `.env` file:

```bash
GEMINI_API_KEY=<your-api-key>
NOTES_DIRECTORY=<path-to-notes-directory>
```

Then you can generate flashcards for all chapters:

```bash
# Generate flashcards for all chapters
pnpm generate

# Generate flashcards for a specific chapter (see config.ts for the list of chapters)
pnpm generate:chapter 01-overview
```

The flashcards are saved in the `scripts/data` folder.

## Structure

- `generate.ts`: Main script that processes files and generates flashcards
- `prompt.ts`: AI prompt template for flashcard generation
- `types.ts`: TypeScript types for flashcards and decks
- `config.ts`: List of markdown files to process
- `env.ts`: Environment variables (GEMINI_API_KEY required)
- `index.ts`: A dummy demo file to test that all dependencies are installed