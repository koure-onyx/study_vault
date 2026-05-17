'use client';

import { motion } from 'framer-motion';

interface Activity {
  _id: string;
  type: 'quiz' | 'read' | 'vault';
  topic_title: string;
  timestamp: string;
  score?: number;
}

interface ActivityFeedProps {
  activities: Activity[];
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'quiz': return '📝';
    case 'read': return '📖';
    case 'vault': return '💾';
    default: return '⚡';
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'quiz': return 'bg-emerald-100 text-emerald-700';
    case 'read': return 'bg-blue-100 text-blue-700';
    case 'vault': return 'bg-purple-100 text-purple-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function formatTimeAgo(timestamp: string) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🎯</div>
        <p className="text-gray-600 font-medium">No recent activity</p>
        <p className="text-sm text-gray-500 mt-1">Start learning to see your progress!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.slice(0, 5).map((activity, idx) => (
        <motion.div
          key={activity._id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
            <span className="text-lg">{getActivityIcon(activity.type)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 line-clamp-1">{activity.topic_title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500 capitalize">{activity.type}</span>
              {activity.score !== undefined && (
                <span className="text-xs font-semibold text-emerald-600">• {activity.score}%</span>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {formatTimeAgo(activity.timestamp)}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
