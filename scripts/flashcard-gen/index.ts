import { createAnthropic } from '@ai-sdk/anthropic';
import { ANTHROPIC_API_KEY } from './env';
import { streamText } from 'ai';
const anthropic = createAnthropic({
    apiKey: ANTHROPIC_API_KEY
});

const model = anthropic('claude-3-5-sonnet-latest');

const { textStream } = streamText({
    model,
    messages: [
        {
            role: 'system',
            content: 'You are a tweet generator. You will generate a tweet about user\'s question.',
        },
        {
            role: 'user',
            content: 'What is a flashcard?',
        },
    ],
});

for await (const textPart of textStream) {
    process.stdout.write(textPart);
}