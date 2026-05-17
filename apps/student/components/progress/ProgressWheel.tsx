'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ProgressWheelProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  showStar?: boolean;
  className?: string;
}

export default function ProgressWheel({
  percentage,
  size = 120,
  strokeWidth = 8,
  showLabel = true,
  showStar = true,
  className = '',
}: ProgressWheelProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  // Determine color and status based on percentage
  const getStatus = () => {
    if (percentage >= 80) return { color: '#10b981', status: 'Mastered!', showStar: true };
    if (percentage >= 30) return { color: '#f59e0b', status: 'In Progress', showStar: false };
    return { color: '#9ca3af', status: 'Not Started', showStar: false };
  };

  const { color, status, showStar: shouldShowStar } = getStatus();

  // Animate on mount and when percentage changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercent(percentage);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [percentage]);

  const currentOffset = circumference - (Math.min(animatedPercent, 100) / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: currentOffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            transitionProperty: 'stroke-dashoffset',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDuration: '1s',
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showLabel && (
          <>
            <motion.span
              key={Math.round(animatedPercent)}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-xl md:text-2xl font-bold"
              style={{ color }}
            >
              {Math.round(animatedPercent)}%
            </motion.span>
            <span className="text-xs text-gray-600 mt-1 text-center px-2">
              {status}
            </span>
          </>
        )}
        
        {/* Star animation for mastered status */}
        {shouldShowStar && showStar && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.5
            }}
            className="absolute -top-2 -right-2 text-2xl"
          >
            ⭐
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Usage example component for dashboard
interface SubjectCardProps {
  subjectName: string;
  progress: number;
  lastAccessed?: string;
  onClick?: () => void;
}

export function SubjectCard({ subjectName, progress, lastAccessed, onClick }: SubjectCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full bg-white rounded-2xl shadow-md p-4 md:p-6 text-left hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center gap-4">
        <ProgressWheel percentage={progress} size={80} strokeWidth={6} />
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 text-lg truncate">{subjectName}</h3>
          {lastAccessed && (
            <p className="text-sm text-gray-500 mt-1">
              Last: {lastAccessed}
            </p>
          )}
          
          <div className="mt-3 flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              progress >= 80 ? 'bg-emerald-100 text-emerald-700' :
              progress >= 30 ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {progress >= 80 ? '✓ Mastered' : progress >= 30 ? '📚 In Progress' : '○ Not Started'}
            </span>
          </div>
        </div>
        
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.button>
  );
}
