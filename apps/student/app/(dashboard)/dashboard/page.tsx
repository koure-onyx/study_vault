'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { BookCard } from '@/components/domain/BookCard';
import { XPTracker } from '@/components/domain/XPTracker';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BookOpen, Clock, Trophy, ArrowRight, Star } from 'lucide-react';

interface Book {
  _id: string;
  title: string;
  subject: string;
  subject_slug: string;
  program_name: string;
  board: string;
  edition_year: number;
  total_chapters: number;
  total_topics: number;
  is_live: boolean;
  metadata?: { grade_level?: string; authors?: string[] };
}

interface DashboardData {
  books: Book[];
  recentProgress: any[];
  totalXP: number;
  masteredCount: number;
}

// Mobile-first skeleton loader using design tokens
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* XP Tracker Skeleton */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6">
        <div className="h-8 bg-skeleton rounded-lg w-1/3 mb-4" />
        <div className="h-4 bg-skeleton rounded w-full mb-2" />
        <div className="h-4 bg-skeleton rounded w-2/3" />
      </div>
      
      {/* Books Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-bg-secondary border border-border rounded-xl p-6 h-64">
            <div className="w-12 h-12 bg-skeleton rounded-xl mb-4" />
            <div className="h-6 bg-skeleton rounded w-3/4 mb-3" />
            <div className="h-4 bg-skeleton rounded w-1/2 mb-6" />
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-skeleton rounded-full" />
                <div className="h-3 bg-skeleton rounded flex-1" />
              </div>
              <div className="flex items-center gap-3 pl-4">
                <div className="w-3 h-3 bg-skeleton rounded-full" />
                <div className="h-2 bg-skeleton rounded flex-1" />
              </div>
              <div className="flex items-center gap-3 pl-4">
                <div className="w-3 h-3 bg-skeleton rounded-full" />
                <div className="h-2 bg-skeleton rounded flex-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Light mode empty state with SVG icons
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="mb-8">
        <svg width="120" height="120" viewBox="0 0 120 120" className="text-text-muted">
          <rect x="30" y="40" width="60" height="50" rx="8" fill="currentColor" opacity="0.1" />
          <path d="M30 40 L60 25 L90 40" stroke="currentColor" strokeWidth="3" fill="none" />
          <line x1="45" y1="55" x2="75" y2="55" stroke="currentColor" strokeWidth="2" />
          <line x1="45" y1="65" x2="75" y2="65" stroke="currentColor" strokeWidth="2" />
          <line x1="45" y1="75" x2="65" y2="75" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-3 text-center">Your Study Vault is Empty</h2>
      <p className="text-text-secondary text-center max-w-md mb-8">
        Start your learning journey by exploring our collection of board-approved textbooks and resources.
      </p>
      <Link href="/books">
        <Button variant="primary" size="lg" icon={<BookOpen size={20} />}>
          Explore Books
        </Button>
      </Link>
    </div>
  );
}

// Error state with proper token usage
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      onRetry();
    }
  };

  return (
    <Card variant="outlined" className="border-l-4 border-error bg-bg-secondary">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-error">
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.1" />
            <path d="M20 10 L20 22 M20 28 L20 30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <circle cx="20" cy="34" r="2" fill="currentColor" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Unable to Load Dashboard</h3>
          <p className="text-text-secondary text-sm mb-4">{error || 'An unexpected error occurred.'}</p>
          {retryCount < maxRetries && (
            <p className="text-xs text-text-muted mb-4">Auto-retrying... (Attempt {retryCount + 1} of {maxRetries})</p>
          )}
          <div className="flex gap-3">
            <Button 
              variant="primary" 
              onClick={handleRetry} 
              disabled={retryCount >= maxRetries}
            >
              {retryCount >= maxRetries ? 'Max Retries Reached' : 'Retry Now'}
            </Button>
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data, error, mutate } = useSWR<DashboardData>('/api/dashboard', async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch dashboard');
    return res.json();
  });

  if (error) {
    return (
      <AppShell>
        <PageContainer title="Dashboard">
          <ErrorState error={error.message} onRetry={() => mutate()} />
        </PageContainer>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <PageContainer title="Dashboard">
          <DashboardSkeleton />
        </PageContainer>
      </AppShell>
    );
  }

  if (data.books.length === 0) {
    return (
      <AppShell>
        <PageContainer title="Dashboard">
          <EmptyState />
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageContainer title="Welcome Back">
        <div className="space-y-8">
          {/* XP Tracker Section */}
          <section aria-label="Progress Overview">
            <XPTracker 
              currentXP={data.totalXP} 
              nextLevelXP={(Math.floor(data.totalXP / 100) + 1) * 100}
              level={Math.floor(data.totalXP / 100) + 1}
            />
          </section>

          {/* Continue Learning Section */}
          {data.recentProgress.length > 0 && (
            <section aria-label="Continue Learning">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Clock className="text-primary" size={20} />
                  Continue Learning
                </h2>
                <Link href="/practice">
                  <Button variant="ghost" size="sm" icon={<ArrowRight size={16} />}>
                    View All
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.recentProgress.slice(0, 2).map((progress: any) => (
                  <Card key={progress.id} variant="elevated" className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-text-primary">{progress.topicTitle}</h3>
                        <p className="text-sm text-text-muted">{progress.bookTitle}</p>
                      </div>
                      <Badge variant="primary">{progress.progress}%</Badge>
                    </div>
                    <div className="w-full bg-bg-tertiary rounded-full h-2 mb-3">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                    <Link href={`/topics/${progress.topicId}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Continue
                      </Button>
                    </Link>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Recent Books Section */}
          <section aria-label="Your Books">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <BookOpen className="text-primary" size={20} />
                Your Books
              </h2>
              <Link href="/books">
                <Button variant="ghost" size="sm" icon={<ArrowRight size={16} />}>
                  View All
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.books.slice(0, 6).map((book) => (
                <BookCard 
                  key={book._id} 
                  book={book} 
                  showProgress={true}
                />
              ))}
            </div>
          </section>

          {/* Mastery Stats */}
          {data.masteredCount > 0 && (
            <section aria-label="Achievements">
              <Card variant="elevated" className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Trophy className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary">{data.masteredCount} Topics Mastered</h3>
                    <p className="text-sm text-text-muted">Keep up the great work!</p>
                  </div>
                  <Star className="ml-auto text-warning" size={24} />
                </div>
              </Card>
            </section>
          )}
        </div>
      </PageContainer>
    </AppShell>
  );
}
