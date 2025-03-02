# Flashcards App

This is an AI-powered Flashcards App designed to enhance the learning experience through intelligent flashcard management and AI-assisted studying. Our application will enable users to create, organize, and study flashcards efficiently, while leveraging AI capabilities to generate content and provide personalized learning assistance.

## Convex

This project uses [Convex](https://convex.dev/) for the backend. You need to create a free account.

## Run locally

To run the application:

> [!NOTE]
> Before you begin: You'll need Node.js 18+ and Git

Clone the repository, open a terminal and navigate to the root directory of the repository. Then, install the dependencies:

```bash
pnpm install
```

Run the following command to start the Convex development server.

```bash
npx convex dev
```

The first time you run the command, you will be asked to log into your Convex account. Follow the instructions in the terminal. It will also ask you to create a new project. You can use the default settings.

Once the development server is running, you will see a `.env.local` file in the project root. Don't modify this file directly. Don't commit this file to the repository either.

Next, run the following command to start the application:

```bash
pnpm dev
```

This will start the application on `http://localhost:5173/proj-flashcards-app`.
