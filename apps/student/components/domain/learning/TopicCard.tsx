import React from 'react';
import { CheckCircle, Circle, Lock } from 'lucide-react';
import Card from '../ui/Card';

/**
 * TopicCard Component
 * 
 * Purpose: Display topic information within chapters
 * Mobile Behavior: Full-width with activity indicators
 * Accessibility: Topic status, progress tracking
 * 
 * @param {Object} props
 * @param {Object} props.topic - Topic data object
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.showProgress - Whether to show completion status
 * @param {string} props.chapterId - Parent chapter ID
 */
interface TopicCardProps {
  topic: {
    id: string;
    number: number;
    title: string;
    duration?: string; // e.g., "15 min"
    isCompleted?: boolean;
    isLocked?: boolean;
    isActive?: boolean;
  };
  onClick: () => void;
  showProgress?: boolean;
  chapterId: string;
}

const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  onClick,
  showProgress = false,
  chapterId
}) => {
  return (
    <Card
      variant={topic.isActive ? 'filled' : 'outlined'}
      onClick={onClick}
      className="w-full mb-2"
      role="article"
      aria-label={`Topic ${topic.number}: ${topic.title}`}
      aria-current={topic.isActive ? 'step' : undefined}
      // Mobile: Compact design for lists
      style={{
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-md)',
        opacity: topic.isLocked ? 0.6 : 1,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Status Icon */}
        <div
          className="flex-shrink-0"
          style={{ width: '24px', height: '24px' }}
          aria-hidden="true"
        >
          {topic.isLocked ? (
            <Lock
              size={20}
              stroke="var(--color-text-muted)"
              strokeWidth={1.5}
            />
          ) : topic.isCompleted ? (
            <CheckCircle
              size={20}
              stroke="var(--color-success)"
              strokeWidth={1.5}
            />
          ) : (
            <Circle
              size={20}
              stroke={topic.isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'}
              strokeWidth={1.5}
            />
          )}
        </div>

        {/* Topic Info */}
        <div className="flex-1 min-w-0">
          <h4
            className={`text-sm font-medium truncate ${
              topic.isActive ? 'text-primary' : 'text-text-primary'
            }`}
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: topic.isActive
                ? 'var(--color-primary)'
                : 'var(--color-text-primary)',
            }}
          >
            {topic.number}. {topic.title}
          </h4>
          
          {topic.duration && !topic.isLocked && (
            <p
              className="text-xs text-text-muted mt-0.5"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
              }}
            >
              {topic.duration}
            </p>
          )}
        </div>

        {/* Active Indicator */}
        {topic.isActive && (
          <div
            className="flex-shrink-0 w-2 h-2 rounded-full bg-primary"
            style={{ backgroundColor: 'var(--color-primary)' }}
            aria-label="Active topic"
          />
        )}
      </div>
    </Card>
  );
};

export default TopicCard;
