import { unstable_noStore as noStore } from 'next/cache';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { BookChapterIndex } from '@/components/reader/BookChapterIndex';
import { ChapterReader } from '@/components/reader/ChapterReader';
import TopicLevelReader from '@/components/reader/TopicLevelReader';
import { parseReaderPath, chapterUrl } from '@/lib/reader-urls';
import {
  findChapterByNumber,
  findChapterBySlug,
  getChapterTopics,
  loadTopicBySlug,
  loadBookReaderData,
} from '@/lib/load-book-reader';
import { canonicalBoardSlug } from '@/lib/reader-urls';

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
  
  if (slugs.length > 0 && isReservedSlug(slugs[0])) {
    notFound();
  }
  
  if (slugs.length === 0) {
    notFound();
  }

  const normalizedSlugs = slugs.map((slug) => String(slug).trim());
  const firstSegment = normalizedSlugs[0].toLowerCase();
  
  if (RESERVED_SLUGS.has(firstSegment)) {
    notFound();
  }

  let programSlug: string | undefined;
  let grade: string | undefined;
  let boardSlug: string | undefined;
  let subjectSlug: string;
  let readerPath: string[] = [];

  // Handle URL Patterns: 
  // 1. Standard: /[board]/[program]/[subject]/...
  // 2. Short: /[program]/[subject]/... (e.g. /grade-9/physics)
  // 3. Subject only: /[subject]

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
  } else if (normalizedSlugs.length >= 3) {
    if (isLegacyProgramSlug(normalizedSlugs[0])) {
      programSlug = normalizedSlugs[0];
      subjectSlug = normalizedSlugs[1];
      readerPath = normalizedSlugs.slice(2);
    } else {
      boardSlug = normalizedSlugs[0];
      programSlug = normalizedSlugs[1];
      subjectSlug = normalizedSlugs[2];
      readerPath = normalizedSlugs.slice(3);
    }
  } else {
    notFound();
  }

  const data = await loadBookReaderData(subjectSlug, { programSlug, boardSlug });
  
  const activeBoardSlug = canonicalBoardSlug(data.boardSlug || data.book.board_id?.short_code || data.book.board_id?.slug || 'PB');
  const activeProgramSlug = data.programSlug || programSlug;
  const activeSubjectSlug = data.book.subject_slug || data.book.slug || subjectSlug;
  
  const { chapterSlug, topicSlug } = parseReaderPath(readerPath);

  // Canonical Check
  if (
    normalizedSlugs[0] !== activeBoardSlug || 
    normalizedSlugs[1] !== activeProgramSlug ||
    normalizedSlugs[2] !== activeSubjectSlug
  ) {
      const canonical = [activeBoardSlug, activeProgramSlug, activeSubjectSlug];
      if (chapterSlug) canonical.push(chapterSlug);
      if (topicSlug) canonical.push(topicSlug);
      permanentRedirect(`/${canonical.join('/')}`);
  }

  if (!chapterSlug) {
    return (
      <BookChapterIndex
        book={data.book}
        program={data.program}
        chapters={data.chapters}
        subjectSlug={activeSubjectSlug}
        boardSlug={activeBoardSlug}
        programSlug={activeProgramSlug}
        grade={data.grade || grade}
        userProgress={[]}
      />
    );
  }

  const chapter = findChapterBySlug(data.chapters, chapterSlug);
  if (!chapter) {
    notFound();
  }

  if (!topicSlug) {
    return (
      <ChapterReader
        book={data.book}
        program={data.program}
        chapter={chapter}
        chapterTopics={[]}
        chapters={data.chapters}
        isLoggedIn={data.isLoggedIn}
        boardSlug={activeBoardSlug}
        subjectSlug={activeSubjectSlug}
        programSlug={activeProgramSlug}
        grade={data.grade || grade}
        prevChapterSlug={null}
        nextChapterSlug={null}
      />
    );
  }

  const topicData = await loadTopicBySlug(topicSlug, activeSubjectSlug, chapterSlug, {
    programSlug,
    boardSlug: activeBoardSlug,
  });

  return (
    <TopicLevelReader
      topic={topicData.topic}
      previousTopic={topicData.previousTopic}
      nextTopic={topicData.nextTopic}
      chapters={topicData.chapters}
      isLoggedIn={topicData.isLoggedIn}
      boardSlug={activeBoardSlug}
      subjectSlug={activeSubjectSlug}
      programSlug={topicData.programSlug}
      grade={topicData.grade}
    />
  );
}
