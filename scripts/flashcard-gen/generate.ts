// Generate flashcards from a given prompt and resources

// 1. Read all the notes in the notes directory
// 2. Generate flashcards for each chapter (folder)
// 3. Save the deck of flashcards to a JSON file

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { NOTES_DIRECTORY } from './env';
import { allMarkdownFiles } from './config';
import { 
  FileInfo, 
  FileInfoSchema,
  Flashcard,
  FlashcardSchema,
  Deck,
  DeckSchema
} from './types';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GEMINI_API_KEY } from './env';
import { generateObject } from 'ai';
import { createFlashcardPrompt } from './prompt';
import { z } from 'zod';

// Get the directory paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptsDir = path.join(__dirname, '..');
const dataDir = path.join(scriptsDir, 'data');

// Parse command line arguments
const args = process.argv.slice(2);
const folderIndex = args.indexOf('--folder');
const targetFolder = folderIndex !== -1 && folderIndex + 1 < args.length ? args[folderIndex + 1] : null;

// Initialize Gemini AI
const google = createGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY
});

const model = google('gemini-2.0-flash');

// Group files by folder
function groupFilesByFolder(files: FileInfo[]): Map<string, FileInfo[]> {
  const grouped = new Map<string, FileInfo[]>();
  for (const file of files) {
    if (!grouped.has(file.folder)) {
      grouped.set(file.folder, []);
    }
    grouped.get(file.folder)!.push(file);
  }
  return grouped;
}

// Read content of a markdown file
async function readMarkdownFile(filePath: string): Promise<string> {
  const content = await fs.readFile(path.join(NOTES_DIRECTORY, filePath), 'utf-8');
  return content;
}

// Ensure output directory exists
async function ensureOutputDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Generate flashcards for a chapter using Gemini AI
async function generateFlashcardsForChapter(
  folder: string,
  files: FileInfo[]
): Promise<Deck> {
  // Sort files to ensure index.md comes first
  const sortedFiles = [...files].sort((a, b) => {
    if (a.isIndex) return -1;
    if (b.isIndex) return 1;
    return a.filename.localeCompare(b.filename);
  });

  // Read all markdown files in the chapter
  const contents = await Promise.all(
    sortedFiles.map(async (file) => {
      const content = await readMarkdownFile(file.path);
      return `
=== ${file.isIndex ? 'INDEX FILE' : 'CONTENT FILE'} ===
Filename: ${file.filename}
Path: ${file.path}
${'-'.repeat(50)}

${content}

${'-'.repeat(50)}
`;
    })
  );

  // Combine all contents with clear separation
  const combinedContent = `
=== CHAPTER INFORMATION ===
Folder: ${folder}
Total Files: ${files.length}
${'-'.repeat(50)}

${contents.join('\n')}`;

  // Create prompt for AI
  const prompt = createFlashcardPrompt(folder, combinedContent);

  // Generate flashcards using AI
  const { object } = await generateObject({
    model,
    schema: z.object({
      deck: DeckSchema
    }),
    prompt,
  });
  
  return object.deck;
}

// Save deck to a JSON file
async function saveDeckToFile(deck: Deck, folder: string, outputDir: string) {
  const filename = `${folder}.json`;
  const outputPath = path.join(outputDir, filename);
  await fs.writeFile(outputPath, JSON.stringify(deck, null, 2));
  console.log(`Saved deck "${deck.title}" to ${outputPath}`);
}

// Main function to generate all flashcards
async function generateAllFlashcards() {
  try {
    // Create output directory for decks if it doesn't exist
    await ensureOutputDir(dataDir);

    // Group files by folder
    const groupedFiles = groupFilesByFolder(allMarkdownFiles);

    // Filter folders if target folder is specified
    const folders = targetFolder 
      ? new Map([[targetFolder, groupedFiles.get(targetFolder)]])
      : groupedFiles;

    if (targetFolder && !folders.has(targetFolder)) {
      throw new Error(`Folder "${targetFolder}" not found`);
    }

    // Generate flashcards for each chapter
    for (const [folder, files] of folders) {
      if (!files) continue;
      
      console.log(`Generating flashcards for ${folder}...`);
      const deck = await generateFlashcardsForChapter(folder, files);
      await saveDeckToFile(deck, folder, dataDir);
    }

    console.log('Flashcard generation complete!');
  } catch (error) {
    console.error('Error generating flashcards:', error);
    process.exit(1);
  }
}

// Run the generator
generateAllFlashcards();

