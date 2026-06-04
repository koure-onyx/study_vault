'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Loader2, List } from 'lucide-react';
import { topicUrl } from '@/lib/reader-urls';

type Chapter = {
  _id: string;
  chapter_number: number;
  title: string;
  slug: string;
};

type BookChapterIndexProps = {
  book: {
    title: string;
    subject?: string;
    subject_slug?: string;
    edition_year?: number;
    board_id?: { name?: string } | null;
    metadata?: { grade_level?: string };
  };
  program: { name: string; slug?: string };
  chapters: Chapter[];
  subjectSlug: string;
  boardSlug?: string;
  programSlug?: string;
  grade?: string;
};

type TopicSummary = {
  _id: string;
  slug: string;
  title: string;
  topic_number?: string;
  display_order?: number;
  estimated_read_time?: number;
};

export function BookChapterIndex({ book, program, chapters, subjectSlug, boardSlug, programSlug, grade }: BookChapterIndexProps) {
  const opts = boardSlug || programSlug || grade ? { boardSlug, programSlug, grade } : undefined;
  const firstChapter = chapters[0];
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [topicsByChapter, setTopicsByChapter] = useState<Record<string, TopicSummary[]>>({});
  const [loadingChapters, setLoadingChapters] = useState<Record<string, boolean>>({});
  const [topicErrors, setTopicErrors] = useState<Record<string, string>>({});

  const searchParams = useSearchParams();

  const previewParam = searchParams.get('preview') === 'true' ? '?preview=true' : '';

  async function toggleChapter(chapter: Chapter) {
    const willExpand = !expandedChapters[chapter._id];
    setExpandedChapters((prev) => ({ ...prev, [chapter._id]: willExpand }));

    if (!willExpand || topicsByChapter[chapter._id] || loadingChapters[chapter._id]) return;

    setLoadingChapters((prev) => ({ ...prev, [chapter._id]: true }));
    setTopicErrors((prev) => ({ ...prev, [chapter._id]: '' }));

    const previewParam = searchParams.get('preview') === 'true' ? '?preview=true' : '';

    try {
      const response = await fetch(`/api/chapters/${chapter._id}/topics${previewParam}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load topics');
      }

      setTopicsByChapter((prev) => ({ ...prev, [chapter._id]: data.data || [] }));
    } catch (error) {
      setTopicErrors((prev) => ({
        ...prev,
        [chapter._id]: error instanceof Error ? error.message : 'Failed to load topics',
      }));
    } finally {
      setLoadingChapters((prev) => ({ ...prev, [chapter._id]: false }));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-amber-50/90 via-white to-white p-8 shadow-sm md:p-12">
          <div className="border-b border-slate-200 pb-8 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {program.name}
              {book.board_id?.name ? ` • ${book.board_id.name}` : ''}
            </p>
            <h1 className="mt-4 font-display text-3xl font-black text-slate-950 md:text-5xl">
              {book.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {book.subject || book.title} — {book.edition_year || new Date().getFullYear()}
            </p>
          </div>

          <div className="pt-8">
            <div className="mb-6 flex items-center gap-3 border-b-2 border-slate-900 pb-3">
              <List className="h-6 w-6 text-slate-800" />
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-slate-900">
                Contents
              </h2>
            </div>
            <p className="mb-8 text-sm text-slate-600">
              Select a chapter to expand its topics. Each topic opens as its own focused reading page.
            </p>

            <ul className="space-y-3">
              {chapters.map((chapter) => {
                const isExpanded = expandedChapters[chapter._id];
                const topics = topicsByChapter[chapter._id] || [];
                const isLoading = loadingChapters[chapter._id];
                const error = topicErrors[chapter._id];

                return (
                  <li key={chapter._id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleChapter(chapter)}
                      className="group flex w-full items-center gap-4 p-5 text-left transition-all hover:bg-slate-50"
                      aria-expanded={isExpanded}
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
                        {chapter.chapter_number}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-lg font-semibold text-slate-900 group-hover:text-indigo-800">
                          {chapter.title}
                        </span>
                        <span className="mt-1 block text-xs font-medium text-slate-500">
                          {isExpanded ? 'Hide topics' : 'Show topics'}
                        </span>
                      </span>
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-slate-400" />
                      ) : isExpanded ? (
                        <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-indigo-600" />
                      ) : (
                        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-indigo-600" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-100 px-5 pb-5">
                        {error ? (
                          <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                            {error}
                          </p>
                        ) : isLoading ? (
                          <p className="flex items-center gap-2 py-4 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading topics
                          </p>
                        ) : topics.length > 0 ? (
                          <ul className="mt-3 space-y-1.5 border-l-2 border-slate-100 pl-4">
                            {topics.map((topic) => {
                              const label =
                                topic.topic_number ||
                                `${chapter.chapter_number}.${topic.display_order ?? ''}`;

                              return (
                                <li key={topic._id}>
                                  <Link
                                    href={`${topicUrl(subjectSlug, chapter.slug, topic.slug, opts)}${previewParam}`}
                                    className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                                  >
                                    <span className="w-12 shrink-0 tabular-nums text-xs font-semibold text-slate-400 group-hover:text-emerald-600">
                                      {label}
                                    </span>
                                    <span className="min-w-0 flex-1 line-clamp-2">{topic.title}</span>
                                    {topic.estimated_read_time ? (
                                      <span className="shrink-0 text-xs text-slate-400">
                                        {topic.estimated_read_time}m
                                      </span>
                                    ) : null}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="py-4 text-sm text-slate-500">No topics in this chapter yet.</p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {chapters.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                No chapters available for this book yet.
              </p>
            )}
          </div>
        </section>
      </div>


    </div>
  );
}
