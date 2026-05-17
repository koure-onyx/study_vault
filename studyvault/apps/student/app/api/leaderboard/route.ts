import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';
import UserProgress from '@studyvault/db/models/UserProgress';

// Mock current user ID - replace with actual auth middleware
const MOCK_USER_ID = '6760c1e5f8a9b2c3d4e5f6a7';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || 'weekly';

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all_time':
      default:
        startDate = new Date(0);
        break;
    }

    // Get all users with their XP
    const users = await User.find({ role: 'student' })
      .select('name student_profile.xp_total')
      .lean();

    // Calculate XP earned in timeframe for each user
    const leaderboardData = await Promise.all(
      users.map(async (user: any) => {
        const progressRecords = await UserProgress.find({
          user_id: user._id,
          last_accessed: { $gte: startDate },
        }).select('xp_earned');

        const xpInTimeframe = progressRecords.reduce(
          (sum, record) => sum + (record.xp_earned || 0),
          0
        );

        return {
          _id: user._id.toString(),
          user_name: user.name,
          xp_total: timeframe === 'all_time' ? user.student_profile?.xp_total || 0 : xpInTimeframe,
          level: Math.floor((user.student_profile?.xp_total || 0) / 1000) + 1,
          avatar_color: getRandomAvatarColor(user._id.toString()),
        };
      })
    );

    // Sort by XP and add rank
    const sorted = leaderboardData
      .sort((a, b) => b.xp_total - a.xp_total)
      .map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
      }))
      .slice(0, 100); // Top 100

    // Find current user's rank
    const currentUserEntry = sorted.find((entry) => entry._id === MOCK_USER_ID);
    const current_user_rank = {
      weekly: currentUserEntry?.rank || sorted.length + 1,
      monthly: currentUserEntry?.rank || sorted.length + 1,
      all_time: currentUserEntry?.rank || sorted.length + 1,
    };

    // Mark current user in the list
    const entries = sorted.map((entry) => ({
      ...entry,
      is_current_user: entry._id === MOCK_USER_ID,
    }));

    return NextResponse.json({
      success: true,
      data: {
        weekly: timeframe === 'weekly' ? entries : [],
        monthly: timeframe === 'monthly' ? entries : [],
        all_time: timeframe === 'all_time' ? entries : [],
        current_user_rank,
      },
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load leaderboard' },
      { status: 500 }
    );
  }
}

function getRandomAvatarColor(userId: string) {
  const colors = [
    'from-emerald-500 to-teal-500',
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-pink-500 to-rose-500',
  ];
  
  const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}
