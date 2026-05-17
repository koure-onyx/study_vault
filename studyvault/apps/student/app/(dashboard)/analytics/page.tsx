'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardCard from '@/components/dashboard/DashboardCard';

interface AnalyticsData {
  xp_history: Array<{
    date: string;
    xp_earned: number;
  }>;
  subject_mastery: Array<{
    subject: string;
    mastery_percent: number;
    topics_mastered: number;
    total_topics: number;
  }>;
  quiz_accuracy: Array<{
    date: string;
    accuracy: number;
    attempts: number;
  }>;
  time_spent: {
    total_hours: number;
    this_week_hours: number;
    daily_average: number;
  };
  weak_topics: Array<{
    _id: string;
    title: string;
    subject_name: string;
    quiz_attempts: number;
    avg_score: number;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const res = await fetch('/api/analytics');
      if (!res.ok) throw new Error('Failed to load analytics');
      const result = await res.json();
      setData(result.data);
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-white/60 backdrop-blur-sm rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Failed to load analytics</p>
          <button
            onClick={fetchAnalytics}
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Your Progress</h1>
          <p className="text-gray-600 mt-2">Track your learning journey and performance</p>
        </motion.div>

        {/* Time Spent Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashboardCard title="Total Time" icon="⏱️">
            <p className="text-3xl font-bold text-gray-900">{data.time_spent.total_hours}h</p>
            <p className="text-sm text-gray-500 mt-1">Lifetime learning</p>
          </DashboardCard>
          <DashboardCard title="This Week" icon="📅">
            <p className="text-3xl font-bold text-gray-900">{data.time_spent.this_week_hours}h</p>
            <p className="text-sm text-gray-500 mt-1">Keep it up!</p>
          </DashboardCard>
          <DashboardCard title="Daily Average" icon="📊">
            <p className="text-3xl font-bold text-gray-900">{data.time_spent.daily_average.toFixed(1)}h</p>
            <p className="text-sm text-gray-500 mt-1">Per day</p>
          </DashboardCard>
        </div>

        {/* XP History Chart */}
        <DashboardCard title="XP Earned (Last 7 Days)" icon="⭐">
          <div className="h-48 flex items-end justify-between gap-2">
            {data.xp_history.map((day, idx) => (
              <motion.div
                key={day.date}
                initial={{ height: 0 }}
                animate={{ height: `${Math.min((day.xp_earned / 200) * 100, 100)}%` }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="flex-1 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg relative group"
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded">
                  {day.xp_earned} XP
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {data.xp_history.map((day) => (
              <span key={day.date}>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
            ))}
          </div>
        </DashboardCard>

        {/* Subject Mastery */}
        <DashboardCard title="Subject Mastery" icon="🎯">
          <div className="space-y-4">
            {data.subject_mastery.map((subject, idx) => (
              <motion.div
                key={subject.subject}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{subject.subject}</span>
                  <span className="text-sm text-gray-600">
                    {subject.topics_mastered}/{subject.total_topics} topics
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${subject.mastery_percent}%` }}
                    transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                    className={`h-full rounded-full ${
                      subject.mastery_percent >= 80
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : subject.mastery_percent >= 50
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </DashboardCard>

        {/* Weak Topics */}
        {data.weak_topics.length > 0 && (
          <DashboardCard title="Needs Review" icon="📝">
            <div className="space-y-3">
              {data.weak_topics.slice(0, 5).map((topic, idx) => (
                <motion.div
                  key={topic._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-gray-900">{topic.title}</p>
                    <p className="text-xs text-gray-500">{topic.subject_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">{Math.round(topic.avg_score)}%</p>
                    <p className="text-xs text-gray-500">{topic.quiz_attempts} attempts</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </DashboardCard>
        )}
      </div>
    </div>
  );
}
