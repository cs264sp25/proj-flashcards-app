import { openai } from "./openai";

async function chat(prompt: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
  });

  return completion.choices[0].message;
}

chat("Hey!").then(console.log);
