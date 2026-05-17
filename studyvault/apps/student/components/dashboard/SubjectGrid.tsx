'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface Subject {
  _id: string;
  name: string;
  slug: string;
  progress_percent: number;
  last_accessed_chapter: string;
  icon_url?: string;
  color_hex?: string;
}

interface SubjectGridProps {
  subjects: Subject[];
}

function ProgressWheel({ percent }: { percent: number }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  
  const getColor = () => {
    if (percent >= 80) return 'text-emerald-500';
    if (percent >= 30) return 'text-amber-500';
    return 'text-gray-300';
  };

  const getStatus = () => {
    if (percent >= 80) return 'Mastered';
    if (percent >= 30) return 'In Progress';
    return 'Not Started';
  };

  return (
    <div className="relative w-16 h-16">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-gray-200"
        />
        <motion.circle
          cx="32"
          cy="32"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.5 }}
          className={getColor()}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-700">{Math.round(percent)}%</span>
      </div>
    </div>
  );
}

export default function SubjectGrid({ subjects }: SubjectGridProps) {
  if (subjects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📚</div>
        <p className="text-gray-600 font-medium">No subjects yet</p>
        <p className="text-sm text-gray-500 mt-1">Start learning to see your progress!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {subjects.map((subject, idx) => (
        <motion.div
          key={subject._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all"
        >
          <Link href={`/subjects/${subject.slug}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{subject.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                  {subject.last_accessed_chapter || 'Not started'}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <ProgressWheel percent={subject.progress_percent} />
                  <div>
                    <p className="text-xs text-gray-600">
                      {subject.progress_percent >= 80 ? '⭐' : subject.progress_percent >= 30 ? '📈' : '⭕'}{' '}
                      {subject.progress_percent >= 80 ? 'Mastered' : subject.progress_percent >= 30 ? 'In Progress' : 'Not Started'}
                    </p>
                    <button className="text-xs text-emerald-600 font-medium mt-1 hover:text-emerald-700">
                      Continue →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
