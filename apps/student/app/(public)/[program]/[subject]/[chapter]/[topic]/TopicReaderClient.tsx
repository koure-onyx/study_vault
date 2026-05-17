'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import ContentBlockRenderer from './ContentBlockRenderer';
import ProgressWheel from './ProgressWheel';

interface Topic {
  _id: string;
  title: string;
  title_urdu?: string;
  content_blocks: any[];
  chapter_id: {
    title: string;
    chapter_number: number;
    slug: string;
  };
  book_id: {
    title: string;
    subject: string;
  };
  program_name?: string;
  subject_name?: string;
  estimated_read_time?: number;
  is_live: boolean;
}

interface TopicReaderClientProps {
  topic: Topic;
  previousTopic: { _id: string; title: string; slug: string } | null;
  nextTopic: { _id: string; title: string; slug: string } | null;
  isHotTopic: boolean;
  examAppearances: number;
}

export default function TopicReaderClient({
  topic,
  previousTopic,
  nextTopic,
  isHotTopic,
  examAppearances,
}: TopicReaderClientProps) {
  const [activeTab, setActiveTab] = useState<'read' | 'practice' | 'ai' | 'vault'>('read');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showLoginWall, setShowLoginWall] = useState(false);

  // Scroll progress tracker
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMarkComplete = async () => {
    // In real app, would call API with user ID from session
    setIsCompleted(true);
    // await fetch('/api/progress/mark-read', { ... })
  };

  const tabs = [
    { id: 'read' as const, label: 'Read', icon: '📖' },
    { id: 'practice' as const, label: 'Practice', icon: '📝' },
    { id: 'ai' as const, label: 'AI Explain', icon: '🤖' },
    { id: 'vault' as const, label: 'Vault', icon: '📚' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200 z-50">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="pt-8 pb-16 max-w-4xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-600 mb-4 overflow-x-auto">
          <span className="whitespace-nowrap">{topic.program_name || 'Grade 9'}</span>
          <span className="text-slate-400">›</span>
          <span className="whitespace-nowrap">{topic.subject_name || topic.book_id?.subject}</span>
          <span className="text-slate-400">›</span>
          <span className="whitespace-nowrap">Ch {topic.chapter_id?.chapter_number}: {topic.chapter_id?.title}</span>
        </nav>

        {/* Hot Topic Badge */}
        {isHotTopic && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 border border-orange-300 rounded-full text-orange-800 text-sm font-medium mb-4">
            <span>🔥</span>
            <span>FBISE Favorite — appeared {examAppearances} times</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              {topic.title}
            </h1>
            <div className="flex items-center gap-3 text-slate-600 text-sm">
              <span>{topic.chapter_id?.title || `Chapter ${topic.chapter_id?.chapter_number}`}</span>
              <span>•</span>
              <span>{topic.estimated_read_time || 3} min read</span>
            </div>
          </div>
          
          {/* TTS Button */}
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 hidden sm:flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Listen
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap
                transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        {activeTab === 'read' && (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg overflow-hidden">
            {/* Content Blocks */}
            <div className="prose prose-slate max-w-none">
              <ContentBlockRenderer blocks={topic.content_blocks || []} />
            </div>

            {/* Guest Preview Wall */}
            {showLoginWall && (
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent flex items-end justify-center pb-12">
                <div className="text-center p-6">
                  <p className="text-lg font-semibold text-slate-700 mb-3">
                    Login to read more
                  </p>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    Sign In to Continue
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleMarkComplete}
            disabled={isCompleted}
            className={`flex-1 py-4 text-lg font-semibold ${
              isCompleted
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700'
            }`}
          >
            {isCompleted ? '✓ Completed!' : '✓ Mark as Completed'}
          </Button>
          
          {nextTopic ? (
            <a href={`/${topic.program_name?.toLowerCase()}/${topic.book_id?.subject.toLowerCase()}/${topic.chapter_id?.slug}/${nextTopic.slug}`}>
              <Button variant="outline" className="w-full sm:w-auto py-4 text-lg">
                Next Topic →
              </Button>
            </a>
          ) : (
            <Button disabled variant="outline" className="w-full sm:w-auto py-4 text-lg opacity-50">
              End of Chapter
            </Button>
          )}
        </div>

        {/* Progress Summary */}
        <div className="mt-8 p-6 bg-white rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-slate-700">Your Progress</span>
            <span className={`text-sm font-medium ${scrollProgress >= 100 ? 'text-emerald-600' : 'text-slate-600'}`}>
              {Math.round(scrollProgress)}% complete
            </span>
          </div>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-emerald-600 bg-emerald-200">
                {isCompleted ? 'Mastered! ⭐' : 'In Progress'}
              </div>
            </div>
            <div className="overflow-hidden h-3 text-xs flex rounded-full bg-emerald-100">
              <div
                style={{ width: `${scrollProgress}%` }}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
