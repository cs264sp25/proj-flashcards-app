# Flashcards App

This is an AI-powered Flashcards App designed to enhance the learning experience through intelligent flashcard management and AI-assisted studying. Our application will enable users to create, organize, and study flashcards efficiently, while leveraging AI capabilities to generate content and provide personalized learning assistance.

## Convex

This project uses [Convex](https://convex.dev/) for the backend. You need to create a free account.

## OpenAI API

This project uses the OpenAI API. You need to create an account and get an API key to use the API. Consult the [quick start guide](https://platform.openai.com/docs/quickstart) for instructions.

## Serverless Python

Although not used in this project, I've included the possibility to use serverless python functions. To that end, I've included a `serverless-python` folder with a simple hello-world API. It uses the Serverless Framework and the AWS provider. For more information on how to use it, please refer to the [README](serverless-python/hello-api/README.md) in the `serverless-python` folder.

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

At this point, you need to set you OpenAI API key. Run the following command:

```bash
npx convex env set OPENAI_API_KEY sk-...
```

This needs to be done only once. The API key will be stored on the Convex server and will be used every time you run the development server. From this point on, you can start the Convex development server with the following command:

```bash
npx convex dev
```

Finally, run the following command to start the frontend development server.

```bash
pnpm dev
```

This will start the application on `http://localhost:5173/proj-flashcards-app`.
