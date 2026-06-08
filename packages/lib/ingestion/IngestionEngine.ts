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
  subject: string;
  subject_slug: string;
  grade_level: string;
  edition_year: number;
  publisher?: string;
  authors?: string[];
  board: string;
  language?: string;
  script_direction?: string;
}

interface ChapterData {
  chapter_number: number;
  chapter_number_display: string;
  title: string;
  slug: string;
  page_start?: number;
  page_end?: number;
  student_learning_outcomes?: string[];
  chapter_summary?: string;
  seo?: {
    meta_title: string;
    meta_description: string;
    keywords: string[];
  };
}

interface ContentBlock {
  type: string;
  text?: string;
  html?: string;
  level?: number;
  latex?: string;
  formula_label?: string;
  headers?: string[];
  rows?: string[][];
  caption?: string;
  src?: string;
  alt?: string;
  figure_number?: string;
  page_coordinates?: string;
  ordered?: boolean;
  items?: string[];
  variant?: string;
  title?: string;
  problem?: string;
  solution?: string;
  steps?: string[];
  answer?: string;
  question?: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  term?: string;
  definition?: string;
  quran_data?: {
    surah: number;
    ayah: number;
    textbook_line_translation: string;
    word_alignments: Array<{
      position: number;
      textbook_urdu: string;
      color_highlight?: string | null;
    }>;
    tafsir_snippet?: string;
  };
  block_order: number;
}

interface TopicData {
  title: string;
  title_urdu?: string;
  slug: string;
  topic_number: string;
  display_order: number;
  difficulty?: string;
  estimated_read_time?: number;
  edition_year: number;
  seo?: {
    meta_title: string;
    meta_description: string;
    keywords: string[];
    source_page?: number;
  };
  raw_text: string;
  clean_html: string;
  content_blocks: ContentBlock[];
  formulas?: Array<{ latex: string; label?: string; plain_text?: string }>;
  key_terms?: Array<string | { term: string; definition: string }>;
  book_mcqs?: Array<{
    question: string;
    options: string[];
    correct_answer: string;
    explanation?: string;
  }>;
  book_short_questions?: string[];
  book_problems?: Array<{ problem: string; answer: string; steps?: string[] }>;
  keywords?: string[];
  quran_reference?: {
    surah: number;
    ayah: number;
    surah_name_arabic?: string;
    surah_name_english?: string;
    juz?: number;
    manzil?: number;
    ruku?: number;
  };
  quran_word_alignments?: Array<{
    position: number;
    textbook_urdu_meaning: string;
    color_highlight?: string | null;
    grammar_note?: string | null;
  }>;
  quran_textbook_translation?: string;
  quran_textbook_tafsir?: string;
}

interface IngestionData {
  book_metadata: BookMetadata;
  chapter: ChapterData;
  topics: TopicData[];
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
    
    // Validate required fields from DeepSeek JSON schema
    if (!book_metadata.edition_year) {
      throw new Error('book_metadata.edition_year is required');
    }
    if (!book_metadata.subject_slug) {
      throw new Error('book_metadata.subject_slug is required');
    }
    if (chapter.chapter_number === undefined || chapter.chapter_number === null) {
      throw new Error('chapter.chapter_number is required');
    }
    
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
    const subjectSlug = book_metadata.subject_slug || generateSlug(book_metadata.subject);
    const bookSlug = `${subjectSlug}-${generateSlug(book_metadata.title)}`;
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
        edition_year: book_metadata.edition_year,
        edition_label: `${book_metadata.edition_year} Edition`,
        is_current_edition: true,
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
      book.edition_year = book_metadata.edition_year;
      book.edition_label = `${book_metadata.edition_year} Edition`;
      book.is_current_edition = true;
      await book.save();
      log.push(`Updated book: ${book.title}`);
    }
    
    // STEP 4: Upsert Chapter
    const chapterSlug = chapter.slug || `chapter-${chapter.chapter_number}`;
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
        chapter_number: chapter.chapter_number,
        description: chapter.chapter_summary || '',
        order: chapter.chapter_number,
      });
      log.push(`Created chapter: ${chapterDoc.title}`);
    } else {
      chapterDoc.title = chapter.title;
      chapterDoc.chapter_number = chapter.chapter_number;
      chapterDoc.program_id = program._id;
      chapterDoc.board_id = board._id;
      chapterDoc.description = chapter.chapter_summary || chapterDoc.description;
      chapterDoc.order = chapter.chapter_number;
      await chapterDoc.save();
      log.push(`Updated chapter: ${chapterDoc.title}`);
    }
    
    // STEP 5: Upsert Topics
    let topicsCreated = 0;
    let topicsUpdated = 0;
    
    for (const topicData of topics) {
      const topicSlug = topicData.slug || `${chapterSlug}-topic-${topicData.topic_number}`;
      const keyTerms = normalizeKeyTerms(topicData.key_terms || []);
      
      let topic = await Topic.findOne({ 
        slug: topicSlug,
        chapter_id: chapterDoc._id 
      });
      
      // Concatenate raw_text from content_blocks if not provided
      let rawText = topicData.raw_text || '';
      if (!rawText && topicData.content_blocks && topicData.content_blocks.length > 0) {
        rawText = topicData.content_blocks
          .filter(block => block.text)
          .map(block => block.text)
          .join('\n\n');
      }
      
      // Use clean_html or concatenate from content_blocks
      let cleanHtml = topicData.clean_html || '';
      if (!cleanHtml && topicData.content_blocks && topicData.content_blocks.length > 0) {
        cleanHtml = topicData.content_blocks
          .filter(block => block.html)
          .map(block => block.html)
          .join('\n');
      }
      
      const topicContentHash = computeHash(cleanHtml);
      
      if (!topic) {
        await Topic.create({
          title: topicData.title,
          title_urdu: topicData.title_urdu || '',
          slug: topicSlug,
          topic_number: topicData.topic_number,
          display_order: topicData.display_order,
          difficulty: topicData.difficulty || 'medium',
          estimated_read_time: topicData.estimated_read_time || 3,
          edition_year: topicData.edition_year || book_metadata.edition_year,
          raw_text: rawText,
          clean_html: cleanHtml,
          content_blocks: topicData.content_blocks || [],
          formulas: topicData.formulas || [],
          key_terms: keyTerms,
          book_mcqs: topicData.book_mcqs || [],
          book_short_questions: topicData.book_short_questions || [],
          book_problems: topicData.book_problems || [],
          keywords: topicData.keywords || [],
          quran_reference: topicData.quran_reference || null,
          quran_word_alignments: topicData.quran_word_alignments || [],
          quran_textbook_translation: topicData.quran_textbook_translation || null,
          quran_textbook_tafsir: topicData.quran_textbook_tafsir || null,
          book_id: book._id,
          chapter_id: chapterDoc._id,
          program_id: program._id,
          board_id: board._id,
          program_name: book_metadata.grade_level,
          subject_name: book_metadata.subject,
          chapter_number: chapter.chapter_number,
          chapter_title: chapter.title,
          seo: topicData.seo || {},
          version_status: 'new' as const,
          is_live: false,
          workflow_status: 'draft' as const,
        });
        topicsCreated++;
        log.push(`Created topic: ${topicData.title}`);
      } else {
        // Only update if content has changed
        if (topic.content_hash !== topicContentHash) {
          topic.title = topicData.title;
          topic.title_urdu = topicData.title_urdu || topic.title_urdu;
          topic.topic_number = topicData.topic_number;
          topic.display_order = topicData.display_order;
          topic.difficulty = topicData.difficulty || topic.difficulty;
          topic.estimated_read_time = topicData.estimated_read_time || topic.estimated_read_time;
          topic.edition_year = topicData.edition_year || book_metadata.edition_year;
          topic.raw_text = rawText;
          topic.clean_html = cleanHtml;
          topic.content_blocks = topicData.content_blocks || topic.content_blocks;
          topic.content_hash = topicContentHash;
          topic.formulas = topicData.formulas || topic.formulas;
          topic.key_terms = keyTerms;
          topic.book_mcqs = topicData.book_mcqs || topic.book_mcqs;
          topic.book_short_questions = topicData.book_short_questions || topic.book_short_questions;
          topic.book_problems = topicData.book_problems || topic.book_problems;
          topic.keywords = topicData.keywords || topic.keywords;
          topic.quran_reference = topicData.quran_reference || topic.quran_reference;
          topic.quran_word_alignments = topicData.quran_word_alignments || topic.quran_word_alignments;
          topic.quran_textbook_translation = topicData.quran_textbook_translation || topic.quran_textbook_translation;
          topic.quran_textbook_tafsir = topicData.quran_textbook_tafsir || topic.quran_textbook_tafsir;
          topic.seo = topicData.seo || topic.seo;
          topic.version_status = 'modified' as const;
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
