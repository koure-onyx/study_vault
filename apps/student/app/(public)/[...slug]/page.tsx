import { unstable_noStore as noStore } from 'next/cache';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { BookChapterIndex } from '@/components/reader/BookChapterIndex';
import { ChapterReader } from '@/components/reader/ChapterReader';
import TopicLevelReader from '@/components/reader/TopicLevelReader';
import { parseReaderPath, chapterUrl } from '@/lib/reader-urls';
import {
  loadBookReaderData,
  findChapterByNumber,
  findChapterBySlug,
  getChapterTopics,
  loadTopicBySlug,
} from '@/lib/load-book-reader';

const RESERVED_SLUGS = new Set([
  'login', 'signup', 'onboarding', 'dashboard', 'books', 'quran', 'profile',
  'my-vault', 'progress', 'premium', 'forgot-password', 'api', 'search-redirect', 'quiz',
  'auth', 'billing', 'admin', '_next', 'static', 'favicon.ico',
]);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Early exit for reserved paths - prevents catch-all from intercepting API routes
function isReservedSlug(slug: string): boolean {
  const lower = slug.toLowerCase();
  return RESERVED_SLUGS.has(lower);
}

function isChapterSegment(value: string | undefined) {
  return Boolean(value && /^chapter-\d+$/i.test(value));
}

function isGradeSegment(value: string | undefined) {
  return Boolean(value && /^grade-.+/i.test(value));
}

function extractGrade(value: string): string {
  return value.replace(/^grade-/i, '');
}

function isLegacyProgramSlug(value: string) {
  return Boolean(
    value &&
      (
        /^grade-\d+/i.test(value) ||
        /^class-\d+/i.test(value) ||
        /^(mdcat|ecat)/i.test(value) ||
        value === 'federal' ||
        value === 'intermediate'
      )
  );
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  noStore();

  const resolvedParams = await params;
  const slugs = resolvedParams.slug ?? [];
  console.log('\n==================================================');
  console.log('DEBUG: ReaderPage slugs:', JSON.stringify(slugs));
  console.log('==================================================\n');
  
  // CRITICAL FIX: Early exit if first slug segment is reserved (api, auth, dashboard, etc.)
  // This prevents the catch-all route from hijacking API calls and internal routes
  if (slugs.length > 0 && isReservedSlug(slugs[0])) {
    console.log(`[ReaderPage] Blocked reserved slug: ${slugs[0]}`);
    notFound();
  }
  
  if (slugs.length === 0) {
    notFound();
  }

  const normalizedSlugs = slugs.map((slug) => String(slug).trim());
  if (normalizedSlugs.some((slug) => slug.length === 0)) {
    notFound();
  }

  const firstSegment = normalizedSlugs[0].toLowerCase();
  if (RESERVED_SLUGS.has(firstSegment)) {
    notFound();
  }

  const legacyProgramSlug = normalizedSlugs[0];
  const legacySubjectSlug = normalizedSlugs[1];
  const legacyChapterSegment = normalizedSlugs[2];
  const legacyTopicSlug = normalizedSlugs[3];

  if (
    normalizedSlugs.length >= 3 &&
    isLegacyProgramSlug(legacyProgramSlug) &&
    legacySubjectSlug &&
    legacyChapterSegment
  ) {
    const legacyData = await loadBookReaderData(legacySubjectSlug, { programSlug: legacyProgramSlug });
    const legacyBoardSlug =
      legacyData.boardSlug ||
      legacyData.book.board_id?.short_code ||
      legacyData.book.board_id?.slug;
    const legacyChapter =
      findChapterBySlug(legacyData.chapters, legacyChapterSegment) ||
      findChapterByNumber(
        legacyData.chapters,
        parseInt(String(legacyChapterSegment).replace(/^chapter-/i, ''), 10)
      );

    if (!legacyChapter) {
      notFound();
    }

    const canonical = [legacyBoardSlug, legacyProgramSlug, legacySubjectSlug, legacyChapter.slug];
    if (legacyTopicSlug) canonical.push(legacyTopicSlug);

    const target = `/${canonical.map((part) => String(part).trim()).filter(Boolean).join('/')}`;
    permanentRedirect(target);
  }

  let programSlug: string | undefined;
  let grade: string | undefined;
  let boardSlug: string | undefined;
  let subjectSlug: string;
  let readerPath: string[] = [];

  // Handle different URL patterns with grade support
  // Patterns: /subject, /subject/grade-9, /subject/grade-9/chapter-1, /subject/grade-9/chapter-1/topic
  // Patterns: /program/subject, /program/subject/grade-9, /program/subject/grade-9/chapter-1, etc.

  if (normalizedSlugs.length === 1) {
    subjectSlug = normalizedSlugs[0];
  } else if (normalizedSlugs.length === 2) {
    if (isGradeSegment(normalizedSlugs[1])) {
      subjectSlug = normalizedSlugs[0];
      grade = extractGrade(normalizedSlugs[1]);
    } else if (isChapterSegment(normalizedSlugs[1])) {
      subjectSlug = normalizedSlugs[0];
      readerPath = normalizedSlugs.slice(1);
    } else {
      programSlug = normalizedSlugs[0];
      subjectSlug = normalizedSlugs[1];
    }
  } else if (normalizedSlugs.length === 3) {
    if (isGradeSegment(normalizedSlugs[1])) {
      // subject/grade-X/chapter-X or subject/grade-X/topic
      subjectSlug = normalizedSlugs[0];
      grade = extractGrade(normalizedSlugs[1]);
      readerPath = normalizedSlugs.slice(2);
    } else if (isChapterSegment(normalizedSlugs[1])) {
      // subject/chapter-X/topic
      subjectSlug = normalizedSlugs[0];
      readerPath = normalizedSlugs.slice(1);
    } else if (isGradeSegment(normalizedSlugs[2])) {
      // program/subject/grade-X
      programSlug = normalizedSlugs[0];
      subjectSlug = normalizedSlugs[1];
      grade = extractGrade(normalizedSlugs[2]);
    } else if (isChapterSegment(normalizedSlugs[2])) {
      // program/subject/chapter-X
      programSlug = normalizedSlugs[0];
      subjectSlug = normalizedSlugs[1];
      readerPath = normalizedSlugs.slice(2);
    } else {
      // program/board/subject
      programSlug = normalizedSlugs[0];
      boardSlug = normalizedSlugs[1];
      subjectSlug = normalizedSlugs[2];
    }
  } else if (normalizedSlugs.length >= 4) {
    if (isGradeSegment(normalizedSlugs[2])) {
      // program/subject/grade-X/chapter-X or program/subject/grade-X/chapter-X/topic
      programSlug = normalizedSlugs[0];
      subjectSlug = normalizedSlugs[1];
      grade = extractGrade(normalizedSlugs[2]);
      readerPath = normalizedSlugs.slice(3);
    } else if (isChapterSegment(normalizedSlugs[2])) {
      // program/subject/chapter-X/topic
      programSlug = normalizedSlugs[0];
      subjectSlug = normalizedSlugs[1];
      readerPath = normalizedSlugs.slice(2);
    } else if (isGradeSegment(normalizedSlugs[3])) {
      // program/board/subject/grade-X
      programSlug = normalizedSlugs[0];
      boardSlug = normalizedSlugs[1];
      subjectSlug = normalizedSlugs[2];
      grade = extractGrade(normalizedSlugs[3]);
    } else if (isChapterSegment(normalizedSlugs[3])) {
      // program/board/subject/chapter-X
      programSlug = normalizedSlugs[0];
      boardSlug = normalizedSlugs[1];
      subjectSlug = normalizedSlugs[2];
      readerPath = normalizedSlugs.slice(3);
    } else {
      // program/board/subject/other - assume it's a chapter or pass through
      programSlug = normalizedSlugs[0];
      boardSlug = normalizedSlugs[1];
      subjectSlug = normalizedSlugs[2];
      readerPath = normalizedSlugs.slice(3);
    }
  }

  // If boardSlug was parsed but is actually a grade segment or duplicate programSlug, clear it
  if (boardSlug && (isGradeSegment(boardSlug) || boardSlug === programSlug)) {
    boardSlug = undefined;
  }

  const { chapterNumber, topicSlug } = parseReaderPath(readerPath);
  const urlOpts = { programSlug, grade };

  // If topic slug is present, render topic-level reader
  if (chapterNumber != null && topicSlug) {
    try {
      const topicData = await loadTopicBySlug(topicSlug, subjectSlug, chapterNumber, { programSlug, boardSlug });
      const activeGrade = grade || topicData.grade;
      
      console.log('\n=== SERVER-SIDE FETCHED TOPIC DATA (FULL RAW OBJECT) ===');
      console.log(JSON.stringify(topicData.topic, null, 2));
      console.log('========================================================\n');

      return (
        <TopicLevelReader
          topic={topicData.topic}
          previousTopic={topicData.previousTopic}
          nextTopic={topicData.nextTopic}
          chapters={topicData.chapters}
          isLoggedIn={topicData.isLoggedIn}
          subjectSlug={subjectSlug}
          programSlug={topicData.programSlug}
          grade={activeGrade}
        />
      );
    } catch (error) {
      console.error('[topic reader]', error);
      throw error;
    }
  }

  try {
    const data = await loadBookReaderData(subjectSlug, { programSlug, boardSlug });
    const { book, program, chapters, topics, isLoggedIn, programSlug: resolvedProgramSlug, grade: resolvedGrade } = data;
    const activeProgramSlug = programSlug || resolvedProgramSlug; const activeGrade = grade || resolvedGrade;

    if (chapterNumber == null) {
      return (
        <BookChapterIndex
          book={book}
          program={program}
          chapters={chapters}
          subjectSlug={subjectSlug}
          programSlug={activeProgramSlug}
          grade={activeGrade}
        />
      );
    }

    const chapter = findChapterByNumber(chapters, chapterNumber);
    if (!chapter) {
      notFound();
    }

    const chapterTopics = getChapterTopics(chapter._id, topics);
    const sorted = [...chapters].sort((a, b) => a.chapter_number - b.chapter_number);
    const idx = sorted.findIndex((c) => c.chapter_number === chapterNumber);
    const prevChapterNumber = idx > 0 ? sorted[idx - 1].chapter_number : null;
    const nextChapterNumber =
      idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1].chapter_number : null;

    return (
      <ChapterReader
        book={book}
        program={program}
        chapter={chapter}
        chapterTopics={chapterTopics}
        chapters={chapters}
        isLoggedIn={isLoggedIn}
        subjectSlug={subjectSlug}
        programSlug={activeProgramSlug}
        grade={activeGrade}
        prevChapterNumber={prevChapterNumber}
        nextChapterNumber={nextChapterNumber}
      />
    );
  } catch (error) {
    console.error('[reader]', error);
    throw error;
  }
}
