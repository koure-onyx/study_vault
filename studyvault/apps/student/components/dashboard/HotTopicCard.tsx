'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface HotTopic {
  _id: string;
  title: string;
  subject_name: string;
  chapter_title: string;
  exam_appearances: number;
  is_hot_topic: boolean;
}

interface HotTopicCardProps {
  topic: HotTopic;
  index: number;
}

export default function HotTopicCard({ topic, index }: HotTopicCardProps) {
  return (
    <Link href={`/topics/${topic._id}`}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.03, x: 4 }}
        className="group flex items-start gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all"
      >
        <motion.span
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, delay: index }}
          className="text-xl"
        >
          🔥
        </motion.span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
            {topic.title}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {topic.subject_name} • {topic.chapter_title}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              Appeared {topic.exam_appearances}x
            </span>
            {topic.is_hot_topic && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                Trending
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
