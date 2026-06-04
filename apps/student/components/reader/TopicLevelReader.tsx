'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Clock, Star, ChevronDown, ChevronRight, Menu, X, List, ArrowLeft, ArrowRight } from 'lucide-react';
import { ContentBlockRenderer } from '@/components/reader/ContentBlockRenderer';
import { TopicPracticeSection } from '@/components/reader/TopicPracticeSection';
import { TopicBreadcrumb } from '@/components/reader/TopicBreadcrumb';
import { Button } from '@/components/ui/Button';
import { bookUrl, chapterUrl, topicUrl } from '@/lib/reader-urls';
import { PreviewWall } from '@/components/reader/PreviewWall';

interface Topic {
  _id: string;
  slug?: string;
  title: string;
  content_blocks: any[];
  chapter_id: {
    _id: string;
    title: string;
    chapter_number: number;
    slug: string;
  };
  book_id: {
    _id: string;
    title: string;
    subject: string;
    slug: string;
  };
  program_id?: {
    _id: string;
    name: string;
    slug: string;
  };
  board_id?: {
    _id: string;
    name: string;
    short_code: string;
  };
  topic_number?: string;
  display_order?: number;
  difficulty?: string;
  estimated_read_time?: number;
  exam_frequency?: any[];
  key_terms?: any[];
  book_mcqs?: any[];
  book_problems?: any[];
  book_short_questions?: any[];
  is_live: boolean;
}

interface Chapter {
  _id: string;
  chapter_number: number;
  title: string;
  slug: string;
}

interface TopicSummary {
  _id: string;
  slug: string;
  title: string;
  topic_number?: string;
  display_order?: number;
  chapter_id?: string;
  chapterSlug?: string;
  estimated_read_time?: number;
}

interface TopicLevelReaderProps {
  topic: Topic;
  previousTopic: { _id: string; title: string; slug: string; chapterSlug?: string } | null;
  nextTopic: { _id: string; title: string; slug: string; chapterSlug?: string } | null;
  chapters: Chapter[];
  isLoggedIn: boolean;
  boardSlug?: string;
  subjectSlug: string;
  programSlug?: string;
  grade?: string;
}

export default function TopicLevelReader({
  topic,
  previousTopic,
  nextTopic,
  chapters,
  isLoggedIn,
  boardSlug,
  subjectSlug,
  programSlug,
  grade,
}: TopicLevelReaderProps) {
  const router = useRouter();

  const opts = boardSlug || programSlug || grade ? { boardSlug, programSlug, grade } : undefined;
  const isHotTopic = topic.exam_frequency?.some((ef: any) => ef.is_hot_topic);

  const searchParams = useSearchParams();
  const previewParam = searchParams.get('preview') === 'true' ? '?preview=true' : '';

  const handleNextTopic = () => {
    if (nextTopic) {
      const targetChapterSlug = nextTopic.chapterSlug ?? topic.chapter_id.slug;
      const path = `${topicUrl(subjectSlug, targetChapterSlug, nextTopic.slug, opts)}${previewParam}`;
      router.push(path);
    }
  };

  const handlePreviousTopic = () => {
    if (previousTopic) {
      const targetChapterSlug = previousTopic.chapterSlug ?? topic.chapter_id.slug;
      const path = `${topicUrl(subjectSlug, targetChapterSlug, previousTopic.slug, opts)}${previewParam}`;
      router.push(path);
    }
  };

  const blocks = topic.content_blocks || [];
  const visibleCount = isLoggedIn ? blocks.length : Math.ceil(blocks.length / 2);
  const visibleBlocks = blocks.slice(0, visibleCount);
  const hiddenBlocks = blocks.slice(visibleCount);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Reader Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 md:px-8">
          <Link
            href={bookUrl(subjectSlug, opts)}
            className="truncate font-display font-bold text-slate-800 hover:text-indigo-600"
          >
            ← {topic.book_id.title}
          </Link>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {topic.program_id?.name}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-10">
          {/* Breadcrumb */}
          <TopicBreadcrumb
            programName={topic.program_id?.name || 'Program'}
            boardSlug={boardSlug}
            programSlug={programSlug}
            bookTitle={topic.book_id.title}
            subjectSlug={subjectSlug}
            chapterSlug={topic.chapter_id.slug}
            chapterNumber={topic.chapter_id.chapter_number}
            chapterTitle={topic.chapter_id.title}
            topicTitle={topic.title}
            topicSlug={topic.slug}
          />

          {/* Topic Header */}
          <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-slate-100 pb-4">
            <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-800">
              {topic.topic_number || `${topic.chapter_id.chapter_number}.${topic.display_order}`}
            </span>
            {topic.difficulty && (
              <span
                className={`rounded-full px-2 py-1 text-xs font-bold uppercase tracking-wider ${
                  topic.difficulty === 'easy'
                    ? 'bg-emerald-100 text-emerald-800'
                    : topic.difficulty === 'medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                }`}
              >
                {topic.difficulty}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
              <Clock className="h-4 w-4" />
              {topic.estimated_read_time || 3} min read
            </span>
            {isHotTopic && (
              <span className="ml-auto flex items-center gap-1.5 rounded-full bg-orange-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-orange-700">
                <Star className="h-3 w-3" />
                Exam Favorite
              </span>
            )}
          </div>

          {/* Topic Title */}
          <h1 className="mb-8 font-display text-3xl font-bold text-slate-900 md:text-4xl">
            {topic.title}
          </h1>

          {/* Content */}
          <div className="prose prose-slate max-w-none">
            {(!blocks?.length || blocks[0]?.type !== 'heading') && (
              <h2 className="mb-6 font-display text-2xl font-bold text-slate-900 md:text-3xl">
                {topic.title}
              </h2>
            )}
            <ContentBlockRenderer blocks={visibleBlocks} topicId={topic._id} />
            {!isLoggedIn && hiddenBlocks.length > 0 && (
              <div className="relative mt-8 max-h-64 overflow-hidden">
                <div className="pointer-events-none select-none opacity-50 blur-sm">
                  <ContentBlockRenderer blocks={hiddenBlocks} topicId={topic._id} />
                </div>
                <PreviewWall />
              </div>
            )}
          </div>

          {/* Practice Section */}
          <TopicPracticeSection topic={topic} />

          {/* Key Terms */}
          {topic.key_terms && topic.key_terms.length > 0 && (
            <div className="mt-12">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="text-rose-600">📚</span> Key Terms
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {topic.key_terms.map((kt: any, idx: number) => (
                  <div key={idx} className="bg-[#FBEAF0] border-[0.5px] border-[#993556] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-[13px] font-medium text-[#993556] mb-1">{kt.term}</div>
                    <div className="text-[12px] text-[#4B1528]/80 leading-relaxed">{kt.definition}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-16 flex items-center justify-between gap-4 border-t border-slate-200 pt-8">
            <Button
              onClick={handlePreviousTopic}
              disabled={!previousTopic}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous Topic
            </Button>

            <Link href={`${chapterUrl(subjectSlug, topic.chapter_id.slug, opts)}${previewParam}`}>
              <Button variant="outline" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Chapter Overview
              </Button>
            </Link>

            <Button
              onClick={handleNextTopic}
              disabled={!nextTopic}
              className="flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Next Topic
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
