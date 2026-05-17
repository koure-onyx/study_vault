'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardCard from '@/components/dashboard/DashboardCard';
import StreakBadge from '@/components/dashboard/StreakBadge';
import SubjectGrid from '@/components/dashboard/SubjectGrid';
import HotTopicCard from '@/components/dashboard/HotTopicCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import JumpBackIn from '@/components/dashboard/JumpBackIn';
import SearchBar from '@/components/search/SearchBar';

interface DashboardStats {
  user: {
    name: string;
    streak_days: number;
    xp_total: number;
    last_active: string;
  };
  next_action: {
    type: 'retry_quiz' | 'continue' | 'review';
    topic_id: string;
    topic_title: string;
    message: string;
    progress_percent?: number;
  } | null;
  subjects: Array<{
    _id: string;
    name: string;
    slug: string;
    progress_percent: number;
    last_accessed_chapter: string;
    icon_url?: string;
    color_hex?: string;
  }>;
  hot_topics: Array<{
    _id: string;
    title: string;
    subject_name: string;
    chapter_title: string;
    exam_appearances: number;
    is_hot_topic: boolean;
  }>;
  recent_activity: Array<{
    _id: string;
    type: 'quiz' | 'read' | 'vault';
    topic_title: string;
    timestamp: string;
    score?: number;
  }>;
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to load dashboard');
      const data = await res.json();
      setStats(data.data);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-32 bg-white/60 backdrop-blur-sm rounded-3xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-white/60 backdrop-blur-sm rounded-3xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Failed to load dashboard</p>
          <button
            onClick={fetchDashboardStats}
            className="mt-4 px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Search */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {getGreeting()}, {stats.user.name.split(' ')[0]}! 👋
              </h1>
              <p className="text-gray-600 mt-1">Ready to master today's topics?</p>
            </div>
            <StreakBadge days={stats.user.streak_days} />
          </div>
          <SearchBar />
        </motion.div>

        {/* Jump Back In - Smart Next Action */}
        {stats.next_action && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <JumpBackIn action={stats.next_action} />
          </motion.div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Subjects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <DashboardCard title="My Subjects" icon="📚">
              <SubjectGrid subjects={stats.subjects} />
            </DashboardCard>
          </motion.div>

          {/* Hot Topics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <DashboardCard title="🔥 Hot This Week" icon="🔥">
              <div className="space-y-4">
                {stats.hot_topics.slice(0, 3).map((topic, idx) => (
                  <HotTopicCard key={topic._id} topic={topic} index={idx} />
                ))}
                {stats.hot_topics.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hot topics this week</p>
                    <p className="text-sm text-gray-400 mt-1">Keep studying to see trending topics!</p>
                  </div>
                )}
              </div>
            </DashboardCard>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <DashboardCard title="Recent Activity" icon="⚡">
            <ActivityFeed activities={stats.recent_activity} />
          </DashboardCard>
        </motion.div>

        {/* XP Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 md:p-8 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Total XP Earned</p>
              <p className="text-4xl md:text-5xl font-bold mt-2">{stats.user.xp_total.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-100 text-sm">Level {Math.floor(stats.user.xp_total / 1000) + 1}</p>
              <p className="text-xs text-emerald-200 mt-1">
                {1000 - (stats.user.xp_total % 1000)} XP to next level
              </p>
            </div>
          </div>
          <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${(stats.user.xp_total % 1000) / 10}%` }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
