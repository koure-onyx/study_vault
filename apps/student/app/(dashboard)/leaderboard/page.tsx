'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardCard from '@/components/dashboard/DashboardCard';

interface LeaderboardEntry {
  rank: number;
  user_name: string;
  xp_total: number;
  level: number;
  avatar_color: string;
  is_current_user?: boolean;
}

interface LeaderboardData {
  weekly: LeaderboardEntry[];
  monthly: LeaderboardEntry[];
  all_time: LeaderboardEntry[];
  current_user_rank: {
    weekly: number;
    monthly: number;
    all_time: number;
  };
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all_time'>('weekly');

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  async function fetchLeaderboard() {
    try {
      const res = await fetch(`/api/leaderboard?timeframe=${timeframe}`);
      if (!res.ok) throw new Error('Failed to load leaderboard');
      const result = await res.json();
      setData(result.data);
    } catch (err) {
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-orange-500';
    if (rank === 2) return 'from-gray-300 to-gray-400';
    if (rank === 3) return 'from-amber-600 to-amber-700';
    return 'from-emerald-500 to-teal-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-white/60 backdrop-blur-sm rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Failed to load leaderboard</p>
          <button
            onClick={fetchLeaderboard}
            className="mt-4 px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const entries = data[timeframe];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-600 mt-2">Compete with students across Pakistan</p>
        </motion.div>

        {/* Timeframe Tabs */}
        <div className="flex justify-center gap-2">
          {(['weekly', 'monthly', 'all_time'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                timeframe === tf
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tf === 'weekly' ? 'Weekly' : tf === 'monthly' ? 'Monthly' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {entries.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            {/* 2nd Place */}
            <div className="text-center">
              <div className="text-4xl mb-2">{getRankBadge(2)}</div>
              <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${getRankColor(2)} flex items-center justify-center text-white font-bold text-xl`}>
                {entries[1].user_name[0]}
              </div>
              <p className="font-semibold text-gray-900 mt-2 line-clamp-1">{entries[1].user_name}</p>
              <p className="text-sm text-gray-500">{entries[1].xp_total.toLocaleString()} XP</p>
              <div className="mt-2 bg-gray-200 rounded-lg py-3 text-xs font-medium text-gray-600">
                Level {entries[1].level}
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center -mt-8">
              <div className="text-5xl mb-2">{getRankBadge(1)}</div>
              <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${getRankColor(1)} flex items-center justify-center text-white font-bold text-2xl shadow-xl`}>
                {entries[0].user_name[0]}
              </div>
              <p className="font-bold text-gray-900 mt-2 line-clamp-1">{entries[0].user_name}</p>
              <p className="text-sm text-gray-500">{entries[0].xp_total.toLocaleString()} XP</p>
              <div className="mt-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg py-3 text-xs font-bold text-white shadow-md">
                Level {entries[0].level}
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center">
              <div className="text-4xl mb-2">{getRankBadge(3)}</div>
              <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${getRankColor(3)} flex items-center justify-center text-white font-bold text-xl`}>
                {entries[2].user_name[0]}
              </div>
              <p className="font-semibold text-gray-900 mt-2 line-clamp-1">{entries[2].user_name}</p>
              <p className="text-sm text-gray-500">{entries[2].xp_total.toLocaleString()} XP</p>
              <div className="mt-2 bg-gray-200 rounded-lg py-3 text-xs font-medium text-gray-600">
                Level {entries[2].level}
              </div>
            </div>
          </motion.div>
        )}

        {/* Full Leaderboard */}
        <DashboardCard title={`Top ${entries.length} Students`} icon="🏆">
          <div className="space-y-2">
            {entries.slice(3, 10).map((entry, idx) => (
              <motion.div
                key={entry.user_name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-4 p-3 rounded-xl ${
                  entry.is_current_user ? 'bg-emerald-50 border-2 border-emerald-200' : 'hover:bg-gray-50'
                } transition-all`}
              >
                <div className="w-8 text-center font-bold text-gray-700">
                  {getRankBadge(idx + 4)}
                </div>
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${entry.avatar_color} flex items-center justify-center text-white font-bold`}>
                  {entry.user_name[0]}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${entry.is_current_user ? 'text-emerald-900' : 'text-gray-900'}`}>
                    {entry.user_name}
                    {entry.is_current_user && <span className="ml-2 text-xs text-emerald-600">(You)</span>}
                  </p>
                  <p className="text-xs text-gray-500">Level {entry.level}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{entry.xp_total.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">XP</p>
                </div>
              </motion.div>
            ))}
          </div>
        </DashboardCard>

        {/* Your Rank Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 text-white shadow-xl"
        >
          <h3 className="text-lg font-bold mb-4">Your Rankings</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-emerald-100 text-xs">Weekly</p>
              <p className="text-2xl font-bold">#{data.current_user_rank.weekly}</p>
            </div>
            <div>
              <p className="text-emerald-100 text-xs">Monthly</p>
              <p className="text-2xl font-bold">#{data.current_user_rank.monthly}</p>
            </div>
            <div>
              <p className="text-emerald-100 text-xs">All Time</p>
              <p className="text-2xl font-bold">#{data.current_user_rank.all_time}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
