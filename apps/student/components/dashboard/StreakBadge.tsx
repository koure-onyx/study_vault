'use client';

import { motion } from 'framer-motion';

interface StreakBadgeProps {
  days: number;
}

export default function StreakBadge({ days }: StreakBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-2xl shadow-lg"
    >
      <motion.span
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        🔥
      </motion.span>
      <div>
        <p className="text-xs font-medium opacity-90">Streak</p>
        <p className="text-lg font-bold">{days} day{days !== 1 ? 's' : ''}</p>
      </div>
    </motion.div>
  );
}
