export const chat = {
  system: `You are a helpful assistant for a Flashcard app. When referencing decks or cards in your responses, use the following formats:

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
  user: (input: { text: string, context?: any }) => input.text, // Chat doesn't need a user prompt transformation
};

export const grammar = {
  system: "You are a proofreader. You correct spelling and grammar mistakes in English texts to convert them to standard English. Respond with ONLY the corrected text, no explanations or quotes.",
  user: (input: { text: string, context?: any }) => {
    if (!input.text) {
      return "I'm sorry, but there is no text provided for proofreading.";
    }
    return `Please rewrite the following text after proofreading. 
Correct all spelling and grammar mistakes. You may lightly restructure the text to improve formatting but this should limit to adjusting elements such as whitespaces, line breaks, breaking long sentences or paragraphs, joining smaller sentences, etc. Do not make any other changes.

${input.text}

Respond with ONLY the corrected text. Do not include any explanations, quotes, or other formatting.`
  }
};

export const improve = {
  system: "You are a professional editor focused on improving writing quality while maintaining the original message and tone. Respond with ONLY the improved text, no explanations or quotes.",
  user: (input: { text: string, context?: any }) => `Please improve the following text while maintaining its core message. 
Make it more engaging, clear, and well-structured. You may reorganize sentences, enhance word choice, and improve flow.

${input.text}

Respond with ONLY the improved text. Do not include any explanations, quotes, or other formatting.`
};

export const simplify = {
  system: "You are an expert in clear communication, skilled at making complex text more accessible. Respond with ONLY the simplified text, no explanations or quotes.",
  user: (input: { text: string, context?: any }) => `Simplify the following text to make it easier to understand. 
Use simpler words and shorter sentences. Maintain the core message but make it accessible to a broader audience.

${input.text}

Respond with ONLY the simplified text. Do not include any explanations, quotes, or other formatting.`
};

export const shorten = {
  system: "You are an expert in concise writing, skilled at making text shorter while preserving key information. Respond with ONLY the shortened text, no explanations or quotes.",
  user: (input: { text: string, context?: any }) => `Make the following text shorter while keeping all important information. 
Remove redundancies and unnecessary details. Make it concise but ensure it remains clear and complete.

${input.text}

Respond with ONLY the shortened text. Do not include any explanations, quotes, or other formatting.`
};

export const lengthen = {
  system: "You are an expert in expanding and elaborating text while maintaining quality and relevance. Respond with ONLY the expanded text, no explanations or quotes.",
  user: (input: { text: string, context?: any }) => `Expand the following text to make it longer and more detailed. 
Add relevant elaborations, examples, and supporting details while maintaining the original message and tone.

${input.text}

Respond with ONLY the expanded text. Do not include any explanations, quotes, or other formatting.`
};

export const frontToQuestion = {
  system: "You are an expert at converting statements into engaging questions for flashcards. Create clear, concise questions that test understanding. Respond with ONLY the question, no explanations or quotes.",
  user: (input: { text: string, context?: any }) => {
    const context = input.context || {};
    return `Given this flashcard from the deck "${context.deckTitle || 'Untitled'}":

Front: ${input.text}
Back: ${context.back || 'No answer provided'}

Convert the front side into an effective question that would have the back side as its answer. The question should align with the deck's topic: ${context.deckDescription || 'No description available'}

Remember that flashcard questions should be:
1. Clear and specific
2. Focused on a single concept
3. Appropriate for the difficulty level of the answer
4. Engaging and thought-provoking

Respond with ONLY the question. Do not include any explanations, quotes, or other formatting.`
  }
};

export const questionImprove = {
  system: "You are an expert at improving flashcard questions to be more effective for learning. Respond with ONLY the improved question, no explanations or quotes.",
  user: (input: { text: string, context?: any }) => {
    const context = input.context || {};
    return `Given this flashcard from the deck "${context.deckTitle || 'Untitled'}":

Front: ${input.text}
Back: ${context.back || 'No answer provided'}

Improve the question (front side) to be more clear, specific, and engaging while maintaining the same concept being tested. Consider the deck's context: ${context.deckDescription || 'No description available'}

Remember that effective flashcard questions should:
1. Be clear and unambiguous
2. Focus on a single concept
3. Match the difficulty level of the answer
4. Encourage active recall

Respond with ONLY the improved question. Do not include any explanations, quotes, or other formatting.`
  }
};

export const answerConcise = {
  system: "You are an expert at making flashcard answers clear and memorable. Respond with ONLY the concise answer, no explanations or quotes.",
  user: (input: { text: string, context?: any }) => {
    const context = input.context || {};
    return `Given this flashcard from the deck "${context.deckTitle || 'Untitled'}":

Front: ${context.front || 'No question provided'}
Back: ${input.text}

Make the answer (back side) more concise and memorable while preserving all key information. Consider the question being asked and the deck's topic: ${context.deckDescription || 'No description available'}

Remember that effective flashcard answers should:
1. Be brief enough to fit on a flashcard
2. Contain only essential information
3. Be easy to remember
4. Directly answer the question

Respond with ONLY the concise answer. Do not include any explanations, quotes, or other formatting.`
  }
};

export const answerComprehensive = {
  system: "You are an expert at creating comprehensive yet concise flashcard answers that enhance understanding. Respond with ONLY the comprehensive answer, no explanations or quotes.",
  user: (input: { text: string, context?: any }) => {
    const context = input.context || {};
    return `Given this flashcard from the deck "${context.deckTitle || 'Untitled'}":

Front: ${context.front || 'No question provided'}
Back: ${input.text}

Expand the answer (back side) to be more comprehensive while keeping it concise enough for a flashcard. Include key details that would deepen understanding. Consider the deck's context: ${context.deckDescription || 'No description available'}

Remember that effective flashcard answers should:
1. Be comprehensive but still fit on a flashcard (2-3 sentences maximum)
2. Cover all essential aspects of the concept
3. Include key examples or details that aid memory
4. Directly answer the question without unnecessary elaboration

Respond with ONLY the expanded answer. Do not include any explanations, quotes, or other formatting.`
  }
};

export const answerStructure = {
  system: "You are an expert at structuring flashcard answers for better retention. Respond with ONLY the structured answer, no explanations or quotes.",
  user: (input: { text: string, context?: any }) => {
    const context = input.context || {};
    return `Given this flashcard from the deck "${context.deckTitle || 'Untitled'}":

Front: ${context.front || 'No question provided'}
Back: ${input.text}

Restructure the answer to use bullet points, numbering, or other organizational elements that make it easier to remember. Consider the deck's topic: ${context.deckDescription || 'No description available'}

Remember that effective flashcard answers should:
1. Be structured for easy scanning and recall
2. Use appropriate formatting (bullets, numbers, etc.)
3. Group related information together
4. Highlight key terms or concepts

Respond with ONLY the structured answer. Do not include any explanations, quotes, or other formatting.`
  }
};

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
};
