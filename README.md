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

## Integrating KaTeX for Math Rendering

To render mathematical formulas using KaTeX within Markdown content (`react-markdown-wrapper.tsx`), we need `remark-math` `rehype-katex` and `katex`. If you are going to replicate this in your own project, you need to follow these steps:

1. **Install Dependencies:**

   ```bash
   pnpm add remark-math rehype-katex katex
   ```

2. **Configure `ReactMarkdown`:**
   Import and add `remarkMath` to `remarkPlugins` and `rehypeKatex` to `rehypePlugins` within the `ReactMarkdown` component props in `src/core/components/react-markdown-wrapper.tsx`.

3. **Import KaTeX CSS:**
   Include the KaTeX stylesheet. You can either add a `<link>` tag to your `index.html` (check Katex website for the latest version/integrity hash) or import it directly in a relevant component (like `react-markdown-wrapper.tsx`) as a global CSS file:

   ```typescript
   import 'katex/dist/katex.min.css';
   ```

4. **Critical Layout Fix (`position: relative`):**
   KaTeX may use `position: absolute` internally to precisely place formula elements. If the direct container wrapping the `ReactMarkdown` output does **not** establish a positioning context (e.g., via `position: relative`, `absolute`, `fixed`, or `sticky`), these absolutely positioned elements might be positioned relative to an ancestor further up the DOM tree or the viewport itself. This can interfere with the layout calculations of parent components, causing unexpected behavior like page overflow or elements being pushed out of place (e.g., the footer appearing too low, requiring scrolling).

   **Solution:** Ensure the direct container wrapping the `ReactMarkdown` output has `position: relative`. In `src/core/components/react-markdown-wrapper.tsx`, this is done by adding the `"relative"` utility class to the main `div`:

   ```tsx
   <div className={cn("prose ...", "relative", className)}>
     <ReactMarkdown ... />
   </div>
   ```

   **Do not remove the `"relative"` class** from this wrapper without verifying that KaTeX rendering no longer causes layout problems. It is essential for containing KaTeX's potentially complex positioning within the component's bounds.
