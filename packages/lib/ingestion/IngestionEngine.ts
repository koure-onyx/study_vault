import connectDB from '@studyvault/db/connect';
import Program from '@studyvault/db/models/Program';
import Board from '@studyvault/db/models/Board';
import Book from '@studyvault/db/models/Book';
import Chapter from '@studyvault/db/models/Chapter';
import Topic from '@studyvault/db/models/Topic';
import crypto from 'crypto';

interface IngestionResult {
  success: boolean;
  message: string;
  data?: {
    bookId?: string;
    chaptersCreated?: number;
    topicsCreated?: number;
  };
}

interface KeyTerm {
  term: string;
  definition: string;
}

interface BookMetadata {
  title: string;
  grade_level: string;
  board: string;
  subject: string;
  description?: string;
  cover_image_url?: string;
}

interface IngestionData {
  book_metadata: BookMetadata;
  chapter: {
    title: string;
    number: number;
    description?: string;
  };
  topics: Array<{
    title: string;
    number: number;
    content_html: string;
    key_terms?: Array<string | { term: string; definition: string }>;
    learning_objectives?: string[];
    summary?: string;
  }>;
}

function computeHash(text: string): string {
  return crypto.createHash('sha256').update(text || '').digest('hex');
}

function generateSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

function normalizeKeyTerms(value: any): KeyTerm[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((term: any) => {
      if (typeof term === 'string') {
        return { term, definition: '' };
      }
      if (term && typeof term === 'object') {
        return {
          term: String(term.term || term.name || term.label || '').trim(),
          definition: String(term.definition || term.explanation || '').trim(),
        };
      }
      return null;
    })
    .filter((item: any) => item && item.term);
}

export async function processBookIngestion(data: IngestionData): Promise<IngestionResult> {
  const log: string[] = [];
  
  try {
    await connectDB();
    
    const { book_metadata, chapter, topics } = data;
    
    // STEP 1: Upsert Program
    let program = await Program.findOne({ slug: generateSlug(book_metadata.grade_level) });
    if (!program) {
      program = await Program.create({
        name: book_metadata.grade_level,
        slug: generateSlug(book_metadata.grade_level),
        program_type: 'academic',
      });
      log.push(`Created program: ${program.name}`);
    }
    
    // STEP 2: Upsert Board - find by slug only (shared across programs), then ensure program_id linkage
    let board = await Board.findOne({ 
      slug: generateSlug(book_metadata.board)
    });
    
    if (!board) {
      board = await Board.create({
        name: book_metadata.board,
        slug: generateSlug(book_metadata.board),
        short_code: book_metadata.board.substring(0, 10).toUpperCase(),
        program_id: program._id,
      });
      log.push(`Created board: ${board.name}`);
    } else {
      // Update program_id if not set (for backward compatibility with old boards)
      if (!board.program_id) {
        board.program_id = program._id;
        await board.save();
      }
    }
    
    // STEP 3: Upsert Book
    const subjectSlug = generateSlug(book_metadata.subject);
    const bookSlug = `${subjectSlug}-${generateSlug(book_metadata.title)}`;
    const currentYear = new Date().getFullYear();
    let book = await Book.findOne({ 
      slug: bookSlug,
      board_id: board._id 
    });
    
    if (!book) {
      book = await Book.create({
        title: book_metadata.title,
        slug: bookSlug,
        subject: book_metadata.subject,
        subject_slug: subjectSlug,
        board: book_metadata.board,
        grade: book_metadata.grade_level,
        program_id: program._id,
        board_id: board._id,
        edition_year: currentYear,
        edition_label: `${currentYear} Edition`,
        is_current_edition: true,
        description: book_metadata.description || '',
        cover_image_url: book_metadata.cover_image_url || null,
        order: 1,
      });
      log.push(`Created book: ${book.title}`);
    } else {
      // Update existing book
      book.subject = book_metadata.subject;
      book.subject_slug = subjectSlug;
      book.board = book_metadata.board;
      book.grade = book_metadata.grade_level;
      book.program_id = program._id;
      book.edition_year = currentYear;
      book.edition_label = `${currentYear} Edition`;
      book.is_current_edition = true;
      book.description = book_metadata.description || book.description;
      book.cover_image_url = book_metadata.cover_image_url || book.cover_image_url;
      await book.save();
      log.push(`Updated book: ${book.title}`);
    }
    
    // STEP 4: Upsert Chapter
    const chapterSlug = `${bookSlug}-chapter-${chapter.number}`;
    let chapterDoc = await Chapter.findOne({ 
      slug: chapterSlug,
      book_id: book._id 
    });
    
    if (!chapterDoc) {
      chapterDoc = await Chapter.create({
        title: chapter.title,
        slug: chapterSlug,
        book_id: book._id,
        program_id: program._id,
        board_id: board._id,
        chapter_number: chapter.number,
        description: chapter.description || '',
        order: chapter.number,
      });
      log.push(`Created chapter: ${chapterDoc.title}`);
    } else {
      chapterDoc.title = chapter.title;
      chapterDoc.chapter_number = chapter.number;
      chapterDoc.program_id = program._id;
      chapterDoc.board_id = board._id;
      chapterDoc.description = chapter.description || chapterDoc.description;
      chapterDoc.order = chapter.number;
      await chapterDoc.save();
      log.push(`Updated chapter: ${chapterDoc.title}`);
    }
    
    // STEP 5: Upsert Topics
    let topicsCreated = 0;
    let topicsUpdated = 0;
    
    for (const topicData of topics) {
      const topicSlug = `${chapterSlug}-topic-${topicData.number}`;
      const keyTerms = normalizeKeyTerms(topicData.key_terms || []);
      
      let topic = await Topic.findOne({ 
        slug: topicSlug,
        chapter_id: chapterDoc._id 
      });
      
      const topicContentHash = computeHash(topicData.content_html);
      
      if (!topic) {
        await Topic.create({
          title: topicData.title,
          slug: topicSlug,
          chapter_id: chapterDoc._id,
          topic_number: topicData.number,
          content_html: topicData.content_html,
          content_hash: topicContentHash,
          key_terms: keyTerms,
          learning_objectives: topicData.learning_objectives || [],
          summary: topicData.summary || '',
          order: topicData.number,
        });
        topicsCreated++;
        log.push(`Created topic: ${topicData.title}`);
      } else {
        // Only update if content has changed
        if (topic.content_hash !== topicContentHash) {
          topic.title = topicData.title;
          topic.content_html = topicData.content_html;
          topic.content_hash = topicContentHash;
          topic.key_terms = keyTerms;
          topic.learning_objectives = topicData.learning_objectives || topic.learning_objectives;
          topic.summary = topicData.summary || topic.summary;
          topic.order = topicData.number;
          await topic.save();
          topicsUpdated++;
          log.push(`Updated topic: ${topicData.title}`);
        } else {
          log.push(`Skipped topic (no changes): ${topicData.title}`);
        }
      }
    }
    
    const successMessage = `Successfully processed: ${book.title} (${log.length} operations)`;
    log.forEach(msg => console.log(`[INGESTION] ${msg}`));
    
    return {
      success: true,
      message: successMessage,
      data: {
        bookId: book._id.toString(),
        chaptersCreated: 1,
        topicsCreated,
      },
    };
  } catch (error: any) {
    console.error('[INGESTION ERROR]', error);
    return {
      success: false,
      message: `Ingestion failed: ${error.message}`,
    };
  }
}

export default processBookIngestion;
