import { notFound } from 'next/navigation';
import connectDB from '@studyvault/db/connect';
import _Topic from '@studyvault/db/models/Topic';
import _Chapter from '@studyvault/db/models/Chapter';
import _Book from '@studyvault/db/models/Book';
import _Program from '@studyvault/db/models/Program';
import '@studyvault/db/models/Board';
import { getAuthUser } from '@studyvault/lib/auth/getAuthUser';
import { resolveUserContentProfile } from '@studyvault/lib/content/bookFilter';
import { serializeForClient } from '@/lib/serialize-for-client';
import { normalizeSlug } from '@studyvault/lib/utils/api-response';

const Topic = _Topic as any;
const Chapter = _Chapter as any;
const Book = _Book as any;
const Program = _Program as any;

export function idString(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

export type BookReaderData = {
  book: any;
  program: any;
  chapters: any[];
  topics: any[];
  isLoggedIn: boolean;
  boardSlug?: string;
  programSlug?: string;
  grade?: string;
};

export async function loadBookReaderData(
  subjectSlug: string,
  opts?: { programSlug?: string; boardSlug?: string }
): Promise<BookReaderData> {

  await connectDB();
  const user = await getAuthUser();
  const isLoggedIn = Boolean(user);

  let book: any = null;
  let program: any = null;
  
  // Normalize subject slug for consistent matching
  const normalizedSubjectSlug = normalizeSlug(subjectSlug);
  
  // Single clean query with normalized slug - no fallbacks needed
  const subjectMatcher = {
    $or: [
      { subject_slug: normalizedSubjectSlug },
      { slug: normalizedSubjectSlug },
      // Handle grade-suffixed subjects (e.g., physics-10 -> physics)
      ...(normalizedSubjectSlug.includes("-")
        ? [{ subject_slug: normalizedSubjectSlug.split("-")[0] }]
        : []),
    ],
  };

  if (opts?.programSlug && opts?.boardSlug) {
    program = await Program.findOne({ slug: opts.programSlug }).lean();
    if (!program) {
      notFound();
    }

    const Board = (await import('@studyvault/db/models/Board')).default as any;
    
    // Normalize board slug for better matching
    const normalizedBoardSlug = opts.boardSlug.toLowerCase().replace(/-/g, ' ');
    const board = await Board.findOne({
      $or: [
        { slug: opts.boardSlug.toLowerCase() },
        { short_code: opts.boardSlug.toUpperCase() },
        { name: new RegExp(`^${normalizedBoardSlug}$`, 'i') },
        { name: new RegExp(normalizedBoardSlug, 'i') },
      ],
    }).lean();
    if (!board) {
      notFound();
    }

    book = await Book.findOne({
      ...subjectMatcher,
      program_id: program._id,
      board_id: board._id,
      is_live: true,
    })
      .sort({ edition_year: -1 })
      .select('title slug subject subject_slug grade program_id board_id metadata seo edition_year is_live is_current_edition')
      .populate('board_id', 'name slug short_code')
      .lean();

    if (!book) {
      book = await Book.findOne({
        ...subjectMatcher,
        program_id: program._id,
        board_id: board._id,
      })
        .sort({ edition_year: -1 })
        .select('title slug subject subject_slug grade program_id board_id metadata seo edition_year is_live is_current_edition')
        .populate('board_id', 'name slug short_code')
        .lean();
    }

    if (!book) {
      notFound();
    }
  } else if (opts?.programSlug) {
    program = await Program.findOne({ slug: opts.programSlug }).select('name slug').lean();
    if (!program) notFound();

    book = await Book.findOne({ ...subjectMatcher, program_id: program._id, is_live: true })
      .sort({ edition_year: -1 })
      .select('title slug subject subject_slug grade program_id board_id metadata seo edition_year is_live is_current_edition')
      .populate('board_id', 'name slug short_code')
      .lean();

    if (!book) {
      book = await Book.findOne({ ...subjectMatcher, program_id: program._id })
        .sort({ edition_year: -1 })
        .select('title slug subject subject_slug grade program_id board_id metadata seo edition_year is_live is_current_edition')
        .populate('board_id', 'name slug short_code')
        .lean();
    }

    if (!book) notFound();
  } else {
    const contentProfile = user ? await resolveUserContentProfile(user) : null;
    const bookQuery: Record<string, unknown> = {
      ...subjectMatcher,
      ...(contentProfile?.programId ? { program_id: contentProfile.programId } : {}),
      ...(contentProfile?.boardId ? { board_id: contentProfile.boardId } : {}),
    };

    book = await Book.findOne({ ...bookQuery, is_live: true })
      .sort({ edition_year: -1 })
      .select('title slug subject subject_slug grade program_id board_id metadata seo edition_year is_live is_current_edition')
      .populate('board_id', 'name slug short_code')
      .lean();

    if (!book) {
      book = await Book.findOne({ ...subjectMatcher, is_current_edition: { $ne: false }, is_live: true })
        .sort({ edition_year: -1 })
        .select('title slug subject subject_slug grade program_id board_id metadata seo edition_year is_live is_current_edition')
        .populate('board_id', 'name slug short_code')
        .lean();
    }

    if (!book) {
      book = await Book.findOne({ ...subjectMatcher, is_live: true })
        .sort({ edition_year: -1 })
        .select('title slug subject subject_slug grade program_id board_id metadata seo edition_year is_live is_current_edition')
        .populate('board_id', 'name slug short_code')
        .lean();
    }

    if (!book) {
      book = await Book.findOne(bookQuery)
        .sort({ edition_year: -1 })
        .select('title slug subject subject_slug grade program_id board_id metadata seo edition_year is_live is_current_edition')
        .populate('board_id', 'name slug short_code')
        .lean();
    }

    if (!book) {
      book = await Book.findOne({ ...subjectMatcher, is_current_edition: { $ne: false } })
        .sort({ edition_year: -1 })
        .select('title slug subject subject_slug grade program_id board_id metadata seo edition_year is_live is_current_edition')
        .populate('board_id', 'name slug short_code')
        .lean();
    }

    if (!book) {
      book = await Book.findOne(subjectMatcher)
        .sort({ edition_year: -1 })
        .select('title slug subject subject_slug grade program_id board_id metadata seo edition_year is_live is_current_edition')
        .populate('board_id', 'name slug short_code')
        .lean();
    }

    if (!book) notFound();

    program = await Program.findById(book.program_id).select('name slug').lean();
    if (!program) notFound();
  }

  const chapters = await Chapter.find({ book_id: book._id })
    .sort({ display_order: 1, chapter_number: 1 })
    .select('_id title slug chapter_number chapter_number_display summary summary_urdu seo display_order book_id')
    .lean();
  

  // Don't load all topics by default - they will be fetched on-demand
  const topics: any[] = [];

  const serializedBoard =
    book.board_id && typeof book.board_id === 'object'
      ? { ...book.board_id, _id: idString(book.board_id._id) }
      : null;

  return serializeForClient({
    book: {
      ...book,
      _id: idString(book._id),
      program_id: idString(book.program_id),
      board_id: serializedBoard || (book.board_id ? idString(book.board_id) : null),
      board: serializedBoard,
    },
    program: { ...program, _id: idString(program._id), slug: program.slug },
    chapters: chapters.map((c: any) => ({
      ...c,
      _id: idString(c._id),
      book_id: idString(c.book_id),
    })),
    topics: [],
    isLoggedIn,
    boardSlug: book.board_id?.short_code || book.board_id?.slug || null,
    programSlug: opts?.programSlug || program.slug,
    grade: book.grade || (book.metadata?.grade_level ? book.metadata.grade_level.replace(/grade\s*/i, '').trim() : undefined) || (program?.slug ? program.slug.replace('grade-', '') : undefined),
  });
}

export function getChapterTopics(chapterId: string, topics: any[]) {
  return topics.filter((t) => String(t.chapter_id) === String(chapterId));
}

export function findChapterByNumber(chapters: any[], chapterNumber: number) {
  return chapters.find((c) => c.chapter_number === chapterNumber) ?? null;
}

export function findChapterBySlug(chapters: any[], chapterSlug: string | number) {
  const value = String(chapterSlug);
  return (
    chapters.find(
      (c) =>
        String(c.slug) === value ||
        String(c.chapter_number) === value ||
        value === `chapter-${c.chapter_number}`
    ) ?? null
  );
}

export async function loadTopicBySlug(
  topicSlug: string,
  subjectSlug: string,
  chapterSlug: string | number,
  opts?: { programSlug?: string; boardSlug?: string }
): Promise<{
  topic: any;
  previousTopic: any;
  nextTopic: any;
  book: any;
  program: any;
  chapters: any[];
  isLoggedIn: boolean;
  boardSlug?: string;
  programSlug?: string;
  grade?: string;
}> {
  await connectDB();
  const user = await getUser();
  const authPayload = await getJwtPayload();
  const isLoggedIn = Boolean(user || authPayload);

  // Load book and program first
  const bookData = await loadBookReaderData(subjectSlug, opts);
  const { book, program, chapters, boardSlug, programSlug: resolvedProgramSlug, grade } = bookData;
  const activeProgramSlug = opts?.programSlug || resolvedProgramSlug;

  // Find the chapter
  const chapter = findChapterBySlug(chapters, chapterSlug);
  if (!chapter) {
    notFound();
  }

  let apiTopic = await Topic.findOne({
    slug: topicSlug,
    chapter_id: chapter._id,
    book_id: book._id,
    is_live: true,
  })
    .select('title slug topic_number display_order difficulty estimated_read_time exam_frequency key_terms book_mcqs book_problems book_short_questions content_blocks chapter_id book_id program_id board_id seo is_live')
    .populate('chapter_id', 'title chapter_number slug')
    .populate('book_id', 'title subject subject_slug slug edition_year seo')
    .populate('program_id', 'name slug')
    .populate('board_id', 'name slug short_code')
    .lean();

  if (!apiTopic && process.env.NODE_ENV !== 'production') {
    apiTopic = await Topic.findOne({
      slug: topicSlug,
      chapter_id: chapter._id,
      book_id: book._id,
    })
      .select('title slug topic_number display_order difficulty estimated_read_time exam_frequency key_terms book_mcqs book_problems book_short_questions content_blocks chapter_id book_id program_id board_id seo is_live')
      .populate('chapter_id', 'title chapter_number slug')
      .populate('book_id', 'title subject subject_slug slug edition_year seo')
      .populate('program_id', 'name slug')
      .populate('board_id', 'name slug short_code')
      .lean();

    if (apiTopic) {
        `[loadTopicBySlug] Preview topic rendered because it is not live: ${topicSlug} (chapter ${chapter.chapter_number} / book ${book.subject_slug})`
      );
    }
  }

  if (!apiTopic) {
    notFound();
  }

  let previousTopic = await Topic.findOne({
    chapter_id: chapter._id,
    display_order: { $lt: apiTopic.display_order },
    is_live: true,
  })
    .sort({ display_order: -1 })
    .select('_id title slug display_order chapter_id')
    .lean();

  let prevTopicChapterSlug = chapter.slug;

  if (!previousTopic) {
    const prevChapter = [...chapters]
      .sort((a, b) => b.display_order - a.display_order || b.chapter_number - a.chapter_number)
      .find((c) => c.display_order < chapter.display_order || c.chapter_number < chapter.chapter_number);

    if (prevChapter) {
      previousTopic = await Topic.findOne({
        chapter_id: prevChapter._id,
        is_live: true,
      })
        .sort({ display_order: -1 })
        .select('_id title slug display_order chapter_id')
        .lean();
      if (previousTopic) {
        prevTopicChapterSlug = prevChapter.slug;
      }
    }
  }

  let nextTopic = await Topic.findOne({
    chapter_id: chapter._id,
    display_order: { $gt: apiTopic.display_order },
    is_live: true,
  })
    .sort({ display_order: 1 })
    .select('_id title slug display_order chapter_id')
    .lean();

  let nextTopicChapterSlug = chapter.slug;

  if (!nextTopic) {
    const nextChapter = [...chapters]
      .sort((a, b) => a.display_order - b.display_order || a.chapter_number - b.chapter_number)
      .find((c) => c.display_order > chapter.display_order || c.chapter_number > chapter.chapter_number);

    if (nextChapter) {
      nextTopic = await Topic.findOne({
        chapter_id: nextChapter._id,
        is_live: true,
      })
        .sort({ display_order: 1 })
        .select('_id title slug display_order chapter_id')
        .lean();
      if (nextTopic) {
        nextTopicChapterSlug = nextChapter.slug;
      }
    }
  }

  // Convert API data to match expected format
  const topic = {
    ...apiTopic,
    _id: idString(apiTopic._id),
    chapter_id: {
      ...apiTopic.chapter_id,
      _id: idString(apiTopic.chapter_id._id),
    },
    book_id: {
      ...apiTopic.book_id,
      _id: idString(apiTopic.book_id._id),
    },
    program_id: apiTopic.program_id ? {
      ...apiTopic.program_id,
      _id: idString(apiTopic.program_id._id),
    } : null,
  };

  return serializeForClient({
    topic,
    previousTopic: previousTopic
      ? { 
          _id: idString(previousTopic._id), 
          title: previousTopic.title, 
          slug: previousTopic.slug,
          chapterSlug: prevTopicChapterSlug,
        }
      : null,
    nextTopic: nextTopic
      ? { 
          _id: idString(nextTopic._id), 
          title: nextTopic.title, 
          slug: nextTopic.slug,
          chapterSlug: nextTopicChapterSlug,
        }
      : null,
    book: {
      ...book,
      _id: idString(book._id),
    },
    program: {
      ...program,
      _id: idString(program._id),
    },
    chapters: chapters.map((c: any) => ({
      ...c,
      _id: idString(c._id),
    })),
    isLoggedIn,
    boardSlug: boardSlug || book.board_id?.short_code || book.board_id?.slug || null,
    programSlug: activeProgramSlug,
    grade,
  });
}
