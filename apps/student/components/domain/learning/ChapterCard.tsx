import React from 'react';
import { ChevronRight, Lock, CheckCircle } from 'lucide-react';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';

/**
 * ChapterCard Component
 * 
 * Purpose: Display chapter information within books
 * Mobile Behavior: Full-width with clear tap targets
 * Accessibility: Progress indicators, chapter numbering
 * 
 * @param {Object} props
 * @param {Object} props.chapter - Chapter data object
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.showProgress - Whether to show progress
 * @param {string} props.bookId - Parent book ID
 */
interface ChapterCardProps {
  chapter: {
    id: string;
    number: number;
    title: string;
    totalTopics?: number;
    completedTopics?: number;
    isLocked?: boolean;
  };
  onClick: () => void;
  showProgress?: boolean;
  bookId: string;
}

const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  onClick,
  showProgress = false,
  bookId
}) => {
  const progress = chapter.totalTopics && chapter.completedTopics !== undefined
    ? (chapter.completedTopics / chapter.totalTopics) * 100
    : 0;

  const isComplete = progress === 100;

  return (
    <Card
      variant="outlined"
      onClick={onClick}
      className="w-full mb-3"
      role="article"
      aria-label={`Chapter ${chapter.number}: ${chapter.title}`}
      // Mobile: Border-left accent for visual hierarchy
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: chapter.isLocked 
          ? 'var(--color-border)' 
          : isComplete 
            ? 'var(--color-success)' 
            : 'var(--color-primary)',
        paddingLeft: 'var(--space-4)',
        paddingVertical: 'var(--space-3)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Chapter Number Badge */}
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-lg"
          style={{
            width: '48px',
            height: '48px',
            backgroundColor: chapter.isLocked
              ? 'var(--color-bg-tertiary)'
              : isComplete
                ? 'var(--color-success)'
                : 'var(--color-primary)',
            color: chapter.isLocked
              ? 'var(--color-text-muted)'
              : 'var(--color-text-inverse)',
          }}
          aria-hidden="true"
        >
          {chapter.isLocked ? (
            <Lock size={20} strokeWidth={1.5} />
          ) : isComplete ? (
            <CheckCircle size={20} strokeWidth={1.5} />
          ) : (
            <span 
              className="text-lg font-semibold"
              style={{ 
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-weight-semibold)',
              }}
            >
              {chapter.number}
            </span>
          )}
        </div>

        {/* Chapter Info */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-base font-semibold text-text-primary truncate"
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            {chapter.title}
          </h3>
          
          {chapter.totalTopics !== undefined && !chapter.isLocked && (
            <p
              className="text-xs text-text-muted mt-1"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
              }}
            >
              {chapter.completedTopics || 0} of {chapter.totalTopics} topics
            </p>
          )}

          {/* Progress Bar */}
          {showProgress && !chapter.isLocked && progress > 0 && (
            <div className="mt-2">
              <ProgressBar
                value={progress}
                max={100}
                showPercentage={false}
                aria-label={`Progress: ${Math.round(progress)}%`}
              />
            </div>
          )}
        </div>

        {/* Navigation Arrow */}
        {!chapter.isLocked && (
          <ChevronRight
            size={20}
            stroke="var(--color-text-secondary)"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        )}
      </div>
    </Card>
  );
};

export default ChapterCard;
