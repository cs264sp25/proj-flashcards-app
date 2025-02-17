# Project Document

We are building an AI-powered Flashcards App. The app will allow users to create, organize, and study flashcards. It will also include AI features to help users generate flashcards abd study with an AI Learning Companion.

## Functional Requirements

### General Features

- Create an account and sign in (through GitHub)
- Create and organize flashcards in decks (supporting markdown)
- Sort, search (full-text), and filter through flashcards

The following features could be implemented, if time permits:

- Study module
- Track study progress and performance
- Tag management
- Organize cards within a deck and shuffle them during study
- Duplicate decks or cards
- Export and import flashcard decks
- Marketplace to share or sell decks of cards

The following features would be nice to have but won't be implemented:

- Add images and multimedia to flashcards
- Mark difficult cards for review
- Study flashcards with spaced repetition
- Set study reminders and goals
- Collaborate on decks with others
- Share decks on social media

### AI Features

- Edit deck title and description (e.g., make it shorter)
- Edit card front and back (e.g., make it more concise, turn it into a question)
- Generate deck title, description, or relevant tags based on the content of the cards in the deck.
- Generate flashcard decks from various inputs like text, PDFs, and web content (e.g., Wikipedia articles)
  - When asked to create flashcards from a source, provide a disclaimer that learners should be making cards themselves, and offer to engage in a Socratic approach to help them in that process but also be ready to just make the flashcards
- Study with an AI Learning Companion through chat that can
  - Perform semantic search among the flashcards
  - Create quizzes from existing flashcard decks
  - Summarize flashcards in a deck
  - Explain concepts in flashcards
  - Provide hints during study (when you can't recall the answer)
  - Evaluate answers and provide feedback

The following features could be implemented, if time permits:

- Enable text-to-speech for flashcards
- Enable audio chat with the AI Learning Companion
- Generate a podcast from a deck of flashcards

The following features would be nice to have but won't be implemented:

- Generate deck cover art
- Generate flashcards from images and multimedia

### Tech Stack

To align with the technology stack used in the Practical Gen AI course, we'll use the following:

1. React for the frontend framework
2. TailwindCSS and Shadcn UI for styling
3. Nanostores and its router libraries for state management and routing
4. Vite for development
5. Convex BaaS for backend services, including authentication and database
6. Use Vercel's AI SDK as a thin abstraction layer for AI features.
   - Ideally, we will not use more complex abstraction (like LangChain or LlamaIndex) to orchestrate AI features, unless necessary.

## Project Roadmap

TBD