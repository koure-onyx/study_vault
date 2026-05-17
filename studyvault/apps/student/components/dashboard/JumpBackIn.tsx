'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface NextAction {
  type: 'retry_quiz' | 'continue' | 'review';
  topic_id: string;
  topic_title: string;
  message: string;
  progress_percent?: number;
}

interface JumpBackInProps {
  action: NextAction;
}

export default function JumpBackIn({ action }: JumpBackInProps) {
  const getIcon = () => {
    switch (action.type) {
      case 'retry_quiz': return '🎯';
      case 'continue': return '➡️';
      case 'review': return '🔄';
    }
  };

  const getButtonColor = () => {
    switch (action.type) {
      case 'retry_quiz': return 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600';
      case 'continue': return 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700';
      case 'review': return 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-white to-gray-50 rounded-3xl p-6 border border-gray-200 shadow-lg"
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl">{getIcon()}</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">Jump Back In</h3>
          <p className="text-gray-600 mt-1">{action.message}</p>
          <p className="text-sm font-medium text-emerald-600 mt-2">{action.topic_title}</p>
          {action.progress_percent !== undefined && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{Math.round(action.progress_percent)}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${action.progress_percent}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                />
              </div>
            </div>
          )}
        </div>
        <Link
          href={`/topics/${action.topic_id}`}
          className={`hidden sm:inline-flex items-center px-6 py-3 bg-gradient-to-r ${getButtonColor()} text-white font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:scale-105`}
        >
          Continue
        </Link>
      </div>
      <Link
        href={`/topics/${action.topic_id}`}
        className={`sm:hidden mt-4 flex items-center justify-center px-6 py-3 bg-gradient-to-r ${getButtonColor()} text-white font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all`}
      >
        Continue →
      </Link>
    </motion.div>
  );
}
