import { z } from "zod";

// --- Zod Schemas for Samples ---
const CardSampleSchema = z.object({
  front: z.string(),
  back: z.string().optional(),
});
type CardSample = z.infer<typeof CardSampleSchema>;

const MessageSampleSchema = z.object({
  role: z.string(), // Could potentially use messageRoleSchema if imported
  content: z.string(),
});
type MessageSample = z.infer<typeof MessageSampleSchema>;

// Base schema containing common fields, easier to extend
const baseInputSchema = z.object({
  text: z.string().optional(), // Text is optional in the base, required by specific tasks
  context: z.record(z.any()).optional(), // General context, refined by specific tasks
  customPrompt: z.string().optional(), // Only used by 'custom'
});

// --- Generic Prompt Definition Types ---

// For standard text manipulation/chat prompts
type PromptDefinition<T extends z.ZodObject<any>> = {
  inputSchema: T;
  system: string;
  user: (input: z.infer<T>) => string;
};

// For prompts generating content based on samples (cards/messages)
type GenerationPromptDefinition<T extends z.ZodObject<any>, SampleType> = {
  inputSchema: T;
  system: string;
  user: (input: z.infer<T> & SampleType) => string;
};

// --- Task Definitions with Input Schemas ---

const chatInputSchema = baseInputSchema.extend({
  task: z.literal("chat"),
  text: z.string(), // Chat requires text
});
type ChatInput = z.infer<typeof chatInputSchema>;

export const chat: PromptDefinition<typeof chatInputSchema> = {
  inputSchema: chatInputSchema,
  system: `You are the learning companion for an AI-powered Flashcard app. The user is chatting with you about the flashcards. You have access to tools to search for decks and cards. When referencing decks or cards in your responses, use the following formats:

For decks:
<InMarkdownDeck deckId="deck_id_here" />

For cards:
<InMarkdownCard cardId="card_id_here" />

For example:
- If you find a deck with ID "abc123", you would write:
<InMarkdownDeck deckId="abc123" />

- If you find a card with ID "xyz789", you would write:
<InMarkdownCard cardId="xyz789" />

Always use these exact formats when referencing decks or cards. Do not include any additional text or formatting around the components.`,
  user: (input: ChatInput) => input.text,
};

const grammarInputSchema = baseInputSchema.extend({
  task: z.literal("grammar"),
  text: z.string(), // Requires text
});
type GrammarInput = z.infer<typeof grammarInputSchema>;

export const grammar: PromptDefinition<typeof grammarInputSchema> = {
  inputSchema: grammarInputSchema,
  system:
    "You are the AI-assistant for an AI-powered Flashcard app and your expertise is in proofreading and correcting spelling and grammar mistakes in English texts to convert them to standard English. You will be provided with an input text and you will need to correct the spelling and grammar mistakes. Respond with ONLY the corrected text, no explanations or quotes.",
  user: (input: GrammarInput) => {
    return `Please rewrite the following input text after proofreading.
Correct all spelling and grammar mistakes. You may lightly restructure the text to improve formatting but this should limit to adjusting elements such as whitespaces, line breaks, breaking long sentences or paragraphs, joining smaller sentences, etc. Do not make any other changes.

Input text:
"""
${input.text}
"""

Respond with ONLY the corrected text. Do not include any explanations, quotes, or other formatting. If you don't find any mistakes, just return the original text. If the input text is empty, just return an empty string.`;
  },
};

const improveInputSchema = baseInputSchema.extend({
  task: z.literal("improve"),
  text: z.string(), // Requires text
});
type ImproveInput = z.infer<typeof improveInputSchema>;

export const improve: PromptDefinition<typeof improveInputSchema> = {
  inputSchema: improveInputSchema,
  system:
    "You are the AI-assistant for an AI-powered Flashcard app and your expertise is in improving writing quality while maintaining the original message and tone. You will be provided with an input text and you will need to improve the writing quality. Respond with ONLY the improved text, no explanations or quotes.",
  user: (input: ImproveInput) => {
    return `Please improve the following input text while maintaining its core message.
Focus on readability, clarity, coherence, and flow. You may reorganize sentences, enhance word choice, and improve flow.

Input text:
"""
${input.text}
"""

Respond with ONLY the improved text. Do not include any explanations, quotes, or other formatting. If the input text is already well-written and doesn't need any improvements, just return the original text. If the input text is empty, just return an empty string.`;
  },
};

const simplifyInputSchema = baseInputSchema.extend({
  task: z.literal("simplify"),
  text: z.string(), // Requires text
});
type SimplifyInput = z.infer<typeof simplifyInputSchema>;

export const simplify: PromptDefinition<typeof simplifyInputSchema> = {
  inputSchema: simplifyInputSchema,
  system:
    "You are the AI-assistant for an AI-powered Flashcard app and your expertise is in simplifying text to make it easier to understand. You will be provided with an input text and you will need to simplify the text. Respond with ONLY the simplified text, no explanations or quotes.",
  user: (input: SimplifyInput) => {
    return `Simplify the following input text to make it easier to understand.
Use may use simpler words or shorter sentences to make it accessible to a broader audience but do not change the core message.

Input text:
"""
${input.text}
"""

Respond with ONLY the simplified text. Do not include any explanations, quotes, or other formatting. If the input text is already simple and doesn't need any simplifications, just return the original text. If the input text is empty, just return an empty string.`;
  },
};

const shortenInputSchema = baseInputSchema.extend({
  task: z.literal("shorten"),
  text: z.string(), // Requires text
});
type ShortenInput = z.infer<typeof shortenInputSchema>;

export const shorten: PromptDefinition<typeof shortenInputSchema> = {
  inputSchema: shortenInputSchema,
  system:
    "You are the AI-assistant for an AI-powered Flashcard app and your expertise is in making text shorter while preserving key information. You will be provided with an input text and you will need to make the text shorter. Respond with ONLY the shortened text, no explanations or quotes.",
  user: (input: ShortenInput) => {
    return `Make the following input text shorter while keeping all important information.
Remove redundancies and unnecessary details. Make it concise but ensure it remains clear and complete.

Input text:
"""
${input.text}
"""

Respond with ONLY the shortened text. Do not include any explanations, quotes, or other formatting. If the input text is already short and doesn't need any shortening, just return the original text. If the input text is empty, just return an empty string.`;
  },
};

const lengthenInputSchema = baseInputSchema.extend({
  task: z.literal("lengthen"),
  text: z.string(), // Requires text
});
type LengthenInput = z.infer<typeof lengthenInputSchema>;

export const lengthen: PromptDefinition<typeof lengthenInputSchema> = {
  inputSchema: lengthenInputSchema,
  system:
    "You are the AI-assistant for an AI-powered Flashcard app and your expertise is in expanding and elaborating text while maintaining quality and relevance. You will be provided with an input text and you will need to make the text longer. Respond with ONLY the expanded text, no explanations or quotes.",
  user: (input: LengthenInput) => {
    return `Expand the following input text to make it longer and more detailed.
You may want to expand the text to make it more detailed and informative but maintain the original message and tone. Also, in most cases, the input text is written in the front or back of a flashcard and so you should not expand the text too much.

Input text:
"""
${input.text}
"""

Respond with ONLY the expanded text. Do not include any explanations, quotes, or other formatting. If the input text is already long and doesn't need any expansion, just return the original text. If the input text is empty, just return an empty string.`;
  },
};

const frontToQuestionInputSchema = baseInputSchema.extend({
  task: z.literal("frontToQuestion"),
  text: z.string(), // Requires text
  // Context might contain 'back' (answer)
  context: z.record(z.any()).optional(),
});
type FrontToQuestionInput = z.infer<typeof frontToQuestionInputSchema>;

export const frontToQuestion: PromptDefinition<
  typeof frontToQuestionInputSchema
> = {
  inputSchema: frontToQuestionInputSchema,
  system:
    "You are the AI-assistant for an AI-powered Flashcard app and your expertise is in converting statements into engaging questions for flashcards. You will be provided with an input text and you will need to convert the text into an effective question. Respond with ONLY the question, no explanations or quotes.",
  user: (input: FrontToQuestionInput) => {
    const context = input.context || {};
    return `Turn the following input text into an effective question to be used as the front of a flashcard.

Input text:
"""
${input.text}
"""

The user might provide the following context that might include the front and back of the flashcard, or information about the deck.

Context:
"""
${JSON.stringify(context, null, 2)}
"""

Remember that flashcard questions should be:
1. Clear and specific
2. Focused on a single concept
3. Appropriate for the difficulty level of the answer
4. Engaging and thought-provoking if possible

Respond with ONLY the question. Do not include any explanations, quotes, or other formatting. If the input text is already a question, just return the original text. If the input text is empty, just return an empty string unless the user has provided a context that includes the answer (back of the flashcard). In that case, create a question based on the answer.`;
  },
};

const questionImproveInputSchema = baseInputSchema.extend({
  task: z.literal("questionImprove"),
  text: z.string(), // Requires text (the question)
  context: z.record(z.any()).optional(),
});
type QuestionImproveInput = z.infer<typeof questionImproveInputSchema>;

export const questionImprove: PromptDefinition<
  typeof questionImproveInputSchema
> = {
  inputSchema: questionImproveInputSchema,
  system:
    "You are the AI-assistant for an AI-powered Flashcard app and your expertise is in improving flashcard questions to be more effective for learning. You will be provided with an input text, which is the question to be improved, and you will need to improve the question. Respond with ONLY the improved question, no explanations or quotes.",
  user: (input: QuestionImproveInput) => {
    const context = input.context || {};
    return `Improve the following input text (question) to be more clear, specific, and engaging while maintaining the same concept being tested.

Input text (question):
"""
${input.text}
"""

The user might provide the following context that might include the front and back of the flashcard, or information about the deck.

Context:
"""
${JSON.stringify(context, null, 2)}
"""

Improve the question (front side) to be more clear, specific, and engaging while maintaining the same concept being tested.

Remember that effective flashcard questions should:
1. Be clear and unambiguous
2. Focus on a single concept
3. Match the difficulty level of the answer
4. Encourage active recall

Respond with ONLY the improved question. Do not include any explanations, quotes, or other formatting. If the input text is not a question, then consider turning it into an effective question. If there is no room for improvement, just return the original text. If the input text is empty, just return an empty string unless the user has provided a context that includes the answer (back of the flashcard). In that case, create an effective question based on the answer.`;
  },
};

const answerConciseInputSchema = baseInputSchema.extend({
  task: z.literal("answerConcise"),
  text: z.string(), // Requires text (the answer)
  context: z.record(z.any()).optional(),
});
type AnswerConciseInput = z.infer<typeof answerConciseInputSchema>;

export const answerConcise: PromptDefinition<typeof answerConciseInputSchema> =
  {
    inputSchema: answerConciseInputSchema,
    system:
      "You are the AI-assistant for an AI-powered Flashcard app and your expertise is in making flashcard answers (written on the back of the flashcard) clear and concise. You will be provided with an input text, which is the answer (text on the back of the flashcard) to be improved, and you will need to improve it. Respond with ONLY the improved answer, no explanations or quotes.",
    user: (input: AnswerConciseInput) => {
      const context = input.context || {};
      return `Make the input text (answer written on the back of the flashcard) more concise while preserving all key information.

Input text (answer):
"""
${input.text}
"""

The user might provide the following context that might include the front and back of the flashcard, or information about the deck.

Context:
"""
${JSON.stringify(context, null, 2)}
"""

Remember that effective flashcard answers should:
1. Be brief enough to fit on a flashcard yet detailed enough to be helpful for learning
2. Contain only essential information
3. Be easy to remember
4. Directly answer the question

Respond with ONLY the concise answer. Do not include any explanations, quotes, or other formatting. If the input text is already concise and doesn't need any improvement, just return the original text. If the input text is empty, just return an empty string unless the user has provided a context that includes the question (front of the flashcard). In that case, create a concise answer based on the question.`;
    },
  };

const answerComprehensiveInputSchema = baseInputSchema.extend({
  task: z.literal("answerComprehensive"),
  text: z.string(), // Requires text (the answer)
  context: z.record(z.any()).optional(),
});
type AnswerComprehensiveInput = z.infer<typeof answerComprehensiveInputSchema>;

export const answerComprehensive: PromptDefinition<
  typeof answerComprehensiveInputSchema
> = {
  inputSchema: answerComprehensiveInputSchema,
  system:
    "You are the AI-assistant for an AI-powered Flashcard app and your expertise is in creating comprehensive yet concise flashcard answers (text on the back of the flashcard) that enhance understanding. You will be provided with an input text, which is the answer to be improved, and you will need to improve it. Respond with ONLY the improved answer, no explanations or quotes.",
  user: (input: AnswerComprehensiveInput) => {
    const context = input.context || {};
    return `Expand the input text (answer written on the back of the flashcard) to be more comprehensive while keeping it concise enough for a flashcard.

Input text (answer):
"""
${input.text}
"""

The user might provide the following context that might include the front and back of the flashcard, or information about the deck.

Context:
"""
${JSON.stringify(context, null, 2)}
"""

Remember that effective flashcard answers should:
1. Be comprehensive but still fit on a flashcard (one or two paragraphs maximum)
2. Cover all essential aspects of the concept
3. Include key examples or details that aid memory
4. Directly answer the question without unnecessary elaboration

Respond with ONLY the expanded answer. Do not include any explanations, quotes, or other formatting. If the input text is already comprehensive and doesn't need any expansion, just return the original text. If the input text is empty, just return an empty string unless the user has provided a context that includes the question (front of the flashcard). In that case, create a comprehensive answer based on the question.`;
  },
};

const answerStructureInputSchema = baseInputSchema.extend({
  task: z.literal("answerStructure"),
  text: z.string(), // Requires text (the answer)
  context: z.record(z.any()).optional(),
});
type AnswerStructureInput = z.infer<typeof answerStructureInputSchema>;

export const answerStructure: PromptDefinition<
  typeof answerStructureInputSchema
> = {
  inputSchema: answerStructureInputSchema,
  system:
    "You are the AI-assistant for an AI-powered Flashcard app and your expertise is in structuring flashcard answers (text on the back of the flashcard) for better retention. You will be provided with an input text, which is the answer to be structured, and you will need to structure it. Respond with ONLY the structured answer, no explanations or quotes.",
  user: (input: AnswerStructureInput) => {
    const context = input.context || {};
    return `Restructure the input text (answer written on the back of the flashcard) to use bullet points, numbering, or other organizational elements that make it easier to understand and remember.

Input text (answer):
"""
${input.text}
"""

The user might provide the following context that might include the front and back of the flashcard, or information about the deck.

Context:
"""
${JSON.stringify(context, null, 2)}
"""

Remember that effective flashcard answers should:
1. Be structured for easy scanning and recall
2. Use appropriate formatting (bullets, numbers, etc.)
3. Group related information together
4. Highlight key terms or concepts

Respond with ONLY the structured answer. Do not include any explanations, quotes, or other formatting. If the input text is already structured and doesn't need any restructuring, just return the original text. If the input text is empty, just return an empty string unless the user has provided a context that includes the question (front of the flashcard). In that case, create a structured answer based on the question.`;
  },
};

const customInputSchema = baseInputSchema.extend({
  task: z.literal("custom"),
  text: z.string(), // Requires text
  customPrompt: z.string(), // Requires customPrompt
  context: z.record(z.any()).optional(),
});
type CustomInput = z.infer<typeof customInputSchema>;

export const custom: PromptDefinition<typeof customInputSchema> = {
  inputSchema: customInputSchema,
  system:
    "You are the AI-assistant for an AI-powered Flashcard app. You will be provided with an input text, and a user prompt (instructions) to edit the input text. Respond with ONLY the edited text, no explanations or quotes.",
  user: (input: CustomInput) => {
    const context = input.context || {};
    return `Edit the input text based on the user prompt.

User prompt:
"""
${input.customPrompt}
"""

Input text:
"""
${input.text}
"""

The user might provide the following context that might include the front and back of the flashcard, or information about the deck.

Context:
"""
${JSON.stringify(context, null, 2)}
"""

Respond with ONLY the edited text. Do not include any explanations, quotes, or other formatting. If the input text is empty, just return an empty string. If the user prompt is empty, just return the original text.`;
  },
};

// --- Helper to format card samples for the prompt ---
const formatCardSamples = (cardSamples: CardSample[]): string => {
  if (!cardSamples || cardSamples.length === 0) {
    return "No card samples available.";
  }
  return cardSamples
    .map(
      (card, index) =>
        `Card ${index + 1}:\nFront: ${card.front}\nBack: ${card.back || "(No back)"}\n---`,
    )
    .join("\n");
};

// --- Card Generation Prompts ---

const generateTitleFromCardsInputSchema = baseInputSchema.extend({
  task: z.literal("generateTitleFromCards"),
  text: z.string().optional(), // Existing title is optional context
  context: z
    .object({
      // Requires deckId in context
      deckId: z.string(), // Changed from IdSchema
    })
    .catchall(z.any()), // Allow other context fields
});
type GenerateTitleFromCardsInput = z.infer<
  typeof generateTitleFromCardsInputSchema
>;
type GenerateTitleFromCardsUserFuncInput = GenerateTitleFromCardsInput & {
  cardSamples: CardSample[];
};

export const generateTitleFromCards: GenerationPromptDefinition<
  typeof generateTitleFromCardsInputSchema,
  { cardSamples: CardSample[] }
> = {
  inputSchema: generateTitleFromCardsInputSchema,
  system:
    "You are an AI assistant helping organize flashcards into decks. Your task is to suggest a concise and descriptive title for a deck based on a sample of its cards. The title should reflect the main topic or theme of the cards. Respond with ONLY the suggested title (max 50 characters), no explanations or quotes.",
  user: (input: GenerateTitleFromCardsUserFuncInput) => {
    const cardContent = formatCardSamples(input.cardSamples);
    return `Based on the following sample of cards from a deck, please suggest a concise and descriptive title (max 50 characters).

Card Samples:
"""
${cardContent}
"""

Respond ONLY with the suggested title. If the card samples are empty, just return an empty string.`;
  },
};

const generateDescriptionFromCardsInputSchema = baseInputSchema.extend({
  task: z.literal("generateDescriptionFromCards"),
  text: z.string().optional(), // Existing description is optional context
  context: z
    .object({
      // Requires deckId
      deckId: z.string(), // Changed from IdSchema
    })
    .catchall(z.any()),
});
type GenerateDescriptionFromCardsInput = z.infer<
  typeof generateDescriptionFromCardsInputSchema
>;
type GenerateDescriptionFromCardsUserFuncInput =
  GenerateDescriptionFromCardsInput & { cardSamples: CardSample[] };

export const generateDescriptionFromCards: GenerationPromptDefinition<
  typeof generateDescriptionFromCardsInputSchema,
  { cardSamples: CardSample[] }
> = {
  inputSchema: generateDescriptionFromCardsInputSchema,
  system:
    "You are an AI assistant helping organize flashcards into decks. Your task is to write a brief description (1-2 sentences, max 200 characters) for a flashcard deck based on a sample of its cards. The description should summarize the content or purpose of the deck. Respond with ONLY the suggested description, no explanations or quotes.",
  user: (input: GenerateDescriptionFromCardsUserFuncInput) => {
    const cardContent = formatCardSamples(input.cardSamples);
    return `Based on the following sample of cards from a deck, please write a brief description (1-2 sentences, max 200 characters) summarizing the deck's content or purpose.

Card Samples:
"""
${cardContent}
"""

Respond ONLY with the suggested description. If the card samples are empty, just return an empty string.`;
  },
};

const generateTagsFromCardsInputSchema = baseInputSchema.extend({
  task: z.literal("generateTagsFromCards"),
  text: z.string().optional(), // Existing tags are optional context
  context: z
    .object({
      // Requires deckId
      deckId: z.string(), // Changed from IdSchema
    })
    .catchall(z.any()),
});
type GenerateTagsFromCardsInput = z.infer<
  typeof generateTagsFromCardsInputSchema
>;
type GenerateTagsFromCardsUserFuncInput = GenerateTagsFromCardsInput & {
  cardSamples: CardSample[];
};

export const generateTagsFromCards: GenerationPromptDefinition<
  typeof generateTagsFromCardsInputSchema,
  { cardSamples: CardSample[] }
> = {
  inputSchema: generateTagsFromCardsInputSchema,
  system:
    "You are an AI assistant helping organize flashcards into decks. Your task is to suggest relevant tags (keywords) for a flashcard deck based on a sample of its cards. Tags should be single words or short phrases, comma-separated. Respond with ONLY the suggested tags, no explanations or quotes.",
  user: (input: GenerateTagsFromCardsUserFuncInput) => {
    const cardContent = formatCardSamples(input.cardSamples);
    return `Based on the following sample of cards from a deck, please suggest 3-5 relevant tags (keywords). Separate tags with commas.

Card Samples:
"""
${cardContent}
"""

Respond ONLY with the comma-separated tags. If the card samples are empty, just return an empty string.`;
  },
};

// --- Helper to format message samples for the prompt ---
const formatMessageSamples = (messageSamples: MessageSample[]): string => {
  if (!messageSamples || messageSamples.length === 0) {
    return "No message samples available.";
  }
  return messageSamples
    .map(
      (msg, index) =>
        `Message ${index + 1} (${msg.role}):\n${msg.content}\n---`,
    )
    .join("\n");
};

// --- Chat Generation Prompts ---

const generateTitleFromMessagesInputSchema = baseInputSchema.extend({
  task: z.literal("generateTitleFromMessages"),
  text: z.string().optional(), // Existing title is optional
  context: z
    .object({
      // Requires chatId
      chatId: z.string(), // Changed from IdSchema
    })
    .catchall(z.any()),
});
type GenerateTitleFromMessagesInput = z.infer<
  typeof generateTitleFromMessagesInputSchema
>;
type GenerateTitleFromMessagesUserFuncInput = GenerateTitleFromMessagesInput & {
  messageSamples: MessageSample[];
};

export const generateTitleFromMessages: GenerationPromptDefinition<
  typeof generateTitleFromMessagesInputSchema,
  { messageSamples: MessageSample[] }
> = {
  inputSchema: generateTitleFromMessagesInputSchema,
  system:
    "You are an AI assistant helping summarize chat conversations. Your task is to suggest a concise and descriptive title for a chat based on a sample of its messages. The title should reflect the main topic or theme of the conversation. Respond with ONLY the suggested title (max 50 characters), no explanations or quotes.",
  user: (input: GenerateTitleFromMessagesUserFuncInput) => {
    const messageContent = formatMessageSamples(input.messageSamples);
    return `Based on the following sample of messages from a chat conversation, please suggest a concise and descriptive title (max 50 characters).

Message Samples:
"""
${messageContent}
"""

Respond ONLY with the suggested title. If the message samples are empty, just return an empty string.`;
  },
};

const generateDescriptionFromMessagesInputSchema = baseInputSchema.extend({
  task: z.literal("generateDescriptionFromMessages"),
  text: z.string().optional(), // Existing desc is optional
  context: z
    .object({
      // Requires chatId
      chatId: z.string(), // Changed from IdSchema
    })
    .catchall(z.any()),
});
type GenerateDescriptionFromMessagesInput = z.infer<
  typeof generateDescriptionFromMessagesInputSchema
>;
type GenerateDescriptionFromMessagesUserFuncInput =
  GenerateDescriptionFromMessagesInput & { messageSamples: MessageSample[] };

export const generateDescriptionFromMessages: GenerationPromptDefinition<
  typeof generateDescriptionFromMessagesInputSchema,
  { messageSamples: MessageSample[] }
> = {
  inputSchema: generateDescriptionFromMessagesInputSchema,
  system:
    "You are an AI assistant helping summarize chat conversations. Your task is to write a brief description (1-2 sentences, max 200 characters) for a chat based on a sample of its messages. The description should summarize the main points or purpose of the conversation. Respond with ONLY the suggested description, no explanations or quotes.",
  user: (input: GenerateDescriptionFromMessagesUserFuncInput) => {
    const messageContent = formatMessageSamples(input.messageSamples);
    return `Based on the following sample of messages from a chat conversation, please write a brief description (1-2 sentences, max 200 characters) summarizing the conversation's key points or purpose.

Message Samples:
"""
${messageContent}
"""

Respond ONLY with the suggested description. If the message samples are empty, just return an empty string.`;
  },
};

const generateTagsFromMessagesInputSchema = baseInputSchema.extend({
  task: z.literal("generateTagsFromMessages"),
  text: z.string().optional(), // Existing tags are optional
  context: z
    .object({
      // Requires chatId
      chatId: z.string(), // Changed from IdSchema
    })
    .catchall(z.any()),
});
type GenerateTagsFromMessagesInput = z.infer<
  typeof generateTagsFromMessagesInputSchema
>;
type GenerateTagsFromMessagesUserFuncInput = GenerateTagsFromMessagesInput & {
  messageSamples: MessageSample[];
};

export const generateTagsFromMessages: GenerationPromptDefinition<
  typeof generateTagsFromMessagesInputSchema,
  { messageSamples: MessageSample[] }
> = {
  inputSchema: generateTagsFromMessagesInputSchema,
  system:
    "You are an AI assistant helping summarize chat conversations. Your task is to suggest relevant tags (keywords) for a chat based on a sample of its messages. Tags should capture the main topics discussed. Tags should be single words or short phrases, comma-separated. Respond with ONLY the suggested tags, no explanations or quotes.",
  user: (input: GenerateTagsFromMessagesUserFuncInput) => {
    const messageContent = formatMessageSamples(input.messageSamples);
    return `Based on the following sample of messages from a chat conversation, please suggest 3-5 relevant tags (keywords). Separate tags with commas.

Message Samples:
"""
${messageContent}
"""

Respond ONLY with the comma-separated tags. If the message samples are empty, just return an empty string.`;
  },
};

// --- Export all prompts ---

export const prompts = {
  chat,
  grammar,
  improve,
  simplify,
  shorten,
  lengthen,
  frontToQuestion,
  questionImprove,
  answerConcise,
  answerComprehensive,
  answerStructure,
  custom,
  generateTitleFromCards,
  generateDescriptionFromCards,
  generateTagsFromCards,
  generateTitleFromMessages,
  generateDescriptionFromMessages,
  generateTagsFromMessages,
};
