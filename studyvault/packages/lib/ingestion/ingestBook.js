// packages/lib/ingestion/ingestBook.js
// This is the most critical non-UI function in the entire platform.
// It takes the DeepSeek JSON and populates the database.

import crypto from 'crypto';
import Program from '@studyvault/db/models/Program';
import Board from '@studyvault/db/models/Board';
import Book from '@studyvault/db/models/Book';
import Chapter from '@studyvault/db/models/Chapter';
import Topic from '@studyvault/db/models/Topic';

function computeHash(text) {
  return crypto.createHash('sha256').update(text || '').digest('hex');
}

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function ingestBook(deepseekJson, adminUserId) {
  const log = [];
  const { book_metadata, chapter, topics } = deepseekJson;

  try {
    // STEP 1: Upsert Program
    let program = await Program.findOne({ slug: generateSlug(book_metadata.grade_level) });
    if (!program) {
      program = await Program.create({
        name: book_metadata.grade_level,
        slug: generateSlug(book_metadata.grade_level),
        program_type: 'academic',
        created_by: adminUserId,
      });
      log.push(`✓ Created Program: ${program.name}`);
    }

    // STEP 2: Upsert Board
    let board = await Board.findOne({ name: book_metadata.board });
    if (!board) {
      board = await Board.create({
        name: book_metadata.board,
        slug: generateSlug(book_metadata.board),
        short_code: book_metadata.board.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 5),
      });
      log.push(`✓ Created Board: ${board.name}`);
    }

    // STEP 3: Upsert Book — handle version control
    const bookSlug = generateSlug(
      `${book_metadata.subject}-${book_metadata.grade_level}-${board.short_code}-${book_metadata.edition_year}`
    );
    
    // Find any existing current edition for this subject+program+board
    const existingCurrentBook = await Book.findOne({
      subject_slug: generateSlug(book_metadata.subject),
      program_id: program._id,
      board_id: board._id,
      is_current_edition: true,
    });

    let book;
    if (existingCurrentBook && existingCurrentBook.edition_year === book_metadata.edition_year) {
      // Same edition — just update
      book = existingCurrentBook;
      log.push(`✓ Updating existing book: ${book.title}`);
    } else if (existingCurrentBook) {
      // New edition — archive the old one
      await Book.findByIdAndUpdate(existingCurrentBook._id, { is_current_edition: false });
      book = await Book.create({
        title: book_metadata.title,
        slug: bookSlug,
        subject: book_metadata.subject,
        subject_slug: generateSlug(book_metadata.subject),
        program_id: program._id,
        board_id: board._id,
        edition_year: book_metadata.edition_year,
        edition_label: `${book_metadata.edition_year} Edition`,
        is_current_edition: true,
        previous_edition_id: existingCurrentBook._id,
        metadata: {
          authors: book_metadata.authors,
          publisher: book_metadata.publisher,
          language: book_metadata.language,
          script_direction: book_metadata.script_direction,
          grade_level: book_metadata.grade_level,
        },
        ingestion_status: 'processing',
        created_by: adminUserId,
      });
      log.push(`✓ Created new edition: ${book.edition_year}. Previous edition archived.`);
    } else {
      // Brand new book
      book = await Book.create({
        title: book_metadata.title,
        slug: bookSlug,
        subject: book_metadata.subject,
        subject_slug: generateSlug(book_metadata.subject),
        program_id: program._id,
        board_id: board._id,
        edition_year: book_metadata.edition_year,
        edition_label: `${book_metadata.edition_year} Edition`,
        is_current_edition: true,
        metadata: {
          authors: book_metadata.authors,
          publisher: book_metadata.publisher,
          language: book_metadata.language,
          script_direction: book_metadata.script_direction,
          grade_level: book_metadata.grade_level,
        },
        ingestion_status: 'processing',
        created_by: adminUserId,
      });
      log.push(`✓ Created new book: ${book.title}`);
    }

    // STEP 4: Upsert Chapter
    let chapterDoc = await Chapter.findOne({
      book_id: book._id,
      chapter_number: chapter.chapter_number,
    });

    if (!chapterDoc) {
      chapterDoc = new Chapter({
        title: chapter.title,
        slug: chapter.slug,
        chapter_number: chapter.chapter_number,
        chapter_number_display: chapter.chapter_number_display || `Chapter ${chapter.chapter_number}`,
        book_id: book._id,
        program_id: program._id,
        board_id: board._id,
        student_learning_outcomes: chapter.student_learning_outcomes,
        summary: chapter.chapter_summary,
        page_start: chapter.page_start,
        page_end: chapter.page_end,
        seo: chapter.seo,
        display_order: chapter.chapter_number,
        is_live: false,
      });
    } else {
      // Update chapter metadata
      chapterDoc.title = chapter.title;
      chapterDoc.student_learning_outcomes = chapter.student_learning_outcomes;
      chapterDoc.summary = chapter.chapter_summary;
      chapterDoc.seo = chapter.seo;
    }

    // STEP 5: Upsert Topics with version diff detection
    const topicIds = [];
    let newCount = 0, modifiedCount = 0, unchangedCount = 0;

    for (const topicData of topics) {
      const contentHash = computeHash(topicData.raw_text);

      // Find previous version of this topic (by slug + chapter)
      let previousVersionId = null;
      let versionStatus = 'new';

      if (book.previous_edition_id) {
        const prevChapter = await Chapter.findOne({
          book_id: book.previous_edition_id,
          chapter_number: chapter.chapter_number,
        });
        if (prevChapter) {
          const prevTopic = await Topic.findOne({
            chapter_id: prevChapter._id,
            slug: topicData.slug,
          });
          if (prevTopic) {
            previousVersionId = prevTopic._id;
            versionStatus = prevTopic.content_hash === contentHash ? 'unchanged' : 'modified';
          }
        }
      }

      // Find existing topic in current chapter (for re-ingestion)
      let topicDoc = await Topic.findOne({
        chapter_id: chapterDoc._id || (await Chapter.findOne({ book_id: book._id, chapter_number: chapter.chapter_number }))?._id,
        slug: topicData.slug,
      });

      const topicPayload = {
        title: topicData.title,
        title_urdu: topicData.title_urdu || '',
        slug: topicData.slug,
        topic_number: topicData.topic_number,
        display_order: topicData.display_order,
        program_id: program._id,
        board_id: board._id,
        program_name: program.name,
        subject_name: book_metadata.subject,
        chapter_number: chapter.chapter_number,
        chapter_title: chapter.title,
        raw_text: topicData.raw_text,
        clean_html: topicData.clean_html,
        content_blocks: topicData.content_blocks,
        formulas: topicData.formulas || [],
        key_terms: topicData.key_terms || [],
        book_mcqs: topicData.book_mcqs || [],
        book_short_questions: topicData.book_short_questions || [],
        book_problems: topicData.book_problems || [],
        keywords: topicData.keywords || [],
        difficulty: topicData.difficulty || 'medium',
        estimated_read_time: topicData.estimated_read_time || 3,
        edition_year: book_metadata.edition_year,
        version_status: versionStatus,
        previous_version_id: previousVersionId,
        content_hash: contentHash,
        seo: topicData.seo || {},
        is_live: false,
        workflow_status: 'draft',
        created_by: adminUserId,
      };

      if (topicDoc) {
        Object.assign(topicDoc, topicPayload);
        await topicDoc.save();
        if (versionStatus === 'modified') modifiedCount++;
        else unchangedCount++;
      } else {
        topicDoc = await Topic.create({ ...topicPayload, book_id: book._id });
        newCount++;
      }

      topicIds.push(topicDoc._id);
    }

    // STEP 6: Update chapter with topic IDs and save
    chapterDoc.topic_ids = topicIds;
    chapterDoc.total_topics = topicIds.length;
    await chapterDoc.save();

    // Update book counters
    const totalTopics = await Topic.countDocuments({ book_id: book._id });
    const totalChapters = await Chapter.countDocuments({ book_id: book._id });
    await Book.findByIdAndUpdate(book._id, {
      total_topics: totalTopics,
      total_chapters: totalChapters,
      ingestion_status: 'complete',
      ingestion_log: log,
    });

    log.push(`✓ Chapter ingested: ${newCount} new, ${modifiedCount} modified, ${unchangedCount} unchanged topics.`);
    return { success: true, log, bookId: book._id, chapterId: chapterDoc._id };

  } catch (err) {
    log.push(`✗ FATAL ERROR: ${err.message}`);
    return { success: false, log, error: err.message };
  }
}
