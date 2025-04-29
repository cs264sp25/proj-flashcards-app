# OpenAI Playground

This folder includes scripts for testing and playing with OpenAI's API.

## Run locally

You must install the dependencies in this folder, separate from the root dependencies:

```bash
cd scripts/openai-playground
pnpm install
```

You should also set the `OPENAI_API_KEY` environment variable in the `.env` file:

```bash
OPENAI_API_KEY=<your-api-key>
```

Then you can run the script:

```bash
pnpm run start
```

To run any of the files separately:

```bash
npx tsx path/to/file.ts
```