'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { bookUrl, topicUrl } from '@/lib/reader-urls';
import { BookReaderNav } from './BookReaderNav';

type ChapterReaderProps = {
  book: any;
  program: any;
  chapter: any;
  chapterTopics: any[];
  chapters: any[];
  isLoggedIn: boolean;
  boardSlug?: string;
  subjectSlug: string;
  programSlug?: string;
  grade?: string;
  prevChapterSlug: string | null;
  nextChapterSlug: string | null;
};

export function ChapterReader({
  book,
  program,
  chapter,
  chapterTopics,
  chapters,
  isLoggedIn,
  boardSlug,
  subjectSlug,
  programSlug,
  grade,
  prevChapterSlug,
  nextChapterSlug,
}: ChapterReaderProps) {
  const opts = boardSlug || programSlug || grade ? { boardSlug, programSlug, grade } : undefined;
  const [topics, setTopics] = useState<any[]>(chapterTopics);
  const [loading, setLoading] = useState(chapterTopics.length === 0);
  const [error, setError] = useState('');

  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    async function loadTopics() {
      setLoading(true);
      setError('');

      const previewParam = searchParams.get('preview') === 'true' ? '?preview=true' : '';

      try {
        const response = await fetch(`/api/chapters/${chapter._id}/topics${previewParam}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load topics');
        }

        if (!cancelled) setTopics(data.data || []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load topics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTopics();

    return () => {
      cancelled = true;
    };
  }, [chapter._id]);

  const previewParam = searchParams.get('preview') === 'true' ? '?preview=true' : '';

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link
            href={`${bookUrl(subjectSlug, opts)}${previewParam}`}
            className="text-sm font-semibold text-indigo-600 hover:underline"
          >
            ← {book.title}
          </Link>
          <span className="text-xs font-medium text-slate-500">{program.name}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
        <div className="mb-10 border-b border-slate-200 pb-8">
          <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">
            Chapter {chapter.chapter_number} of {chapters.length}
          </p>
          <h1 className="mt-2 font-display text-3xl font-black text-slate-900 md:text-4xl">
            {chapter.title}
          </h1>
          <p className="mt-3 text-slate-600">
            Select a topic to open a focused page with reading content and practice.
          </p>
        </div>

        {loading ? (
          <p className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-10 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading topics
          </p>
        ) : error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
            {error}
          </p>
        ) : topics.length > 0 ? (
          <ul className="space-y-3">
            {topics.map((topic) => {
              const label = topic.topic_number || `${chapter.chapter_number}.${topic.display_order ?? ''}`;

              return (
                <li key={topic._id}>
                  <Link
                    href={`${topicUrl(subjectSlug, chapter.slug, topic.slug, opts)}${previewParam}`}
                    className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50/60 hover:shadow-md"
                  >
                    <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700">
                      {label}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-base font-semibold text-slate-900 group-hover:text-emerald-900">
                        {topic.title}
                      </span>
                      <span className="mt-1 block text-xs font-medium text-slate-500">
                        Open topic
                      </span>
                    </span>
                    {topic.estimated_read_time ? (
                      <span className="shrink-0 text-xs font-semibold text-slate-400">
                        {topic.estimated_read_time}m
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
            No topics in this chapter yet.
          </p>
        )}
      </main>

      <BookReaderNav
        boardSlug={boardSlug}
        subjectSlug={subjectSlug}
        programSlug={programSlug}
        bookTitle={book.title}
        chapterSlug={chapter.slug}
        chapterNumber={chapter.chapter_number}
        chapterTitle={chapter.title}
        grade={grade}
        prevChapterSlug={prevChapterSlug}
        nextChapterSlug={nextChapterSlug}
        totalChapters={chapters.length}
      />
    </div>
  );
}
