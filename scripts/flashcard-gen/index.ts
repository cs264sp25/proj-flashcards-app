import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GEMINI_API_KEY } from './env';
import { streamText } from 'ai';

const google = createGoogleGenerativeAI({
    apiKey: GEMINI_API_KEY
});

const model = google('gemini-2.0-flash');

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