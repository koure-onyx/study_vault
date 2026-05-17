import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import UserProgress from '@studyvault/db/models/UserProgress';
import Topic from '@studyvault/db/models/Topic';

// Mock current user ID - replace with actual auth middleware
const MOCK_USER_ID = '6760c1e5f8a9b2c3d4e5f6a7';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get all user progress records
    const userProgress = await UserProgress.find({ user_id: MOCK_USER_ID })
      .populate('topic_id', 'title subject_name')
      .sort({ last_accessed: -1 });

    // Calculate XP history (last 7 days)
    const now = new Date();
    const xpHistory = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayXP = userProgress
        .filter((p) => {
          const accessed = new Date(p.last_accessed);
          return accessed >= dayStart && accessed < dayEnd;
        })
        .reduce((sum, p) => sum + (p.xp_earned || 0), 0);

      xpHistory.push({
        date: dayStart.toISOString(),
        xp_earned: dayXP,
      });
    }

    // Calculate subject mastery
    const subjectMap = new Map();
    userProgress.forEach((progress) => {
      const topic = progress.topic_id as any;
      if (!topic) return;

      const subject = topic.subject_name || 'Unknown';
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, {
          topics: [],
          mastered: 0,
          total: 0,
        });
      }

      const subjectData = subjectMap.get(subject);
      subjectData.total++;
      subjectData.topics.push(progress);
      if (progress.mastery_status === 'mastered' || progress.highest_quiz_score >= 80) {
        subjectData.mastered++;
      }
    });

    const subjectMastery = Array.from(subjectMap.entries()).map(([subject, data]: [string, any]) => ({
      subject,
      mastery_percent: (data.mastered / data.total) * 100,
      topics_mastered: data.mastered,
      total_topics: data.total,
    }));

    // Calculate quiz accuracy trend (last 7 days)
    const quizAccuracy = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayAttempts = userProgress.filter((p) => {
        const accessed = new Date(p.last_accessed);
        return accessed >= dayStart && accessed < dayEnd && p.quiz_attempts > 0;
      });

      const totalAttempts = dayAttempts.reduce((sum, p) => sum + p.quiz_attempts, 0);
      const correctAttempts = dayAttempts.reduce(
        (sum, p) => sum + Math.round((p.highest_quiz_score / 100) * p.quiz_attempts),
        0
      );

      quizAccuracy.push({
        date: dayStart.toISOString(),
        accuracy: totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0,
        attempts: totalAttempts,
      });
    }

    // Calculate time spent
    const totalTimeSeconds = userProgress.reduce((sum, p) => sum + (p.time_spent_seconds || 0), 0);
    const totalTimeHours = Math.round(totalTimeSeconds / 3600);

    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekSeconds = userProgress
      .filter((p) => new Date(p.last_accessed) >= thisWeekStart)
      .reduce((sum, p) => sum + (p.time_spent_seconds || 0), 0);
    const thisWeekHours = Math.round(thisWeekSeconds / 3600);

    const dailyAverage = totalTimeHours > 0 ? totalTimeHours / 30 : 0; // Last 30 days average

    // Find weak topics (low quiz scores with multiple attempts)
    const weakTopics = userProgress
      .filter((p) => p.quiz_attempts >= 2 && p.highest_quiz_score < 60)
      .map((progress) => {
        const topic = progress.topic_id as any;
        return {
          _id: progress._id.toString(),
          title: topic?.title || 'Unknown Topic',
          subject_name: topic?.subject_name || 'Unknown',
          quiz_attempts: progress.quiz_attempts,
          avg_score: progress.highest_quiz_score,
        };
      })
      .sort((a, b) => a.avg_score - b.avg_score)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        xp_history: xpHistory,
        subject_mastery: subjectMastery,
        quiz_accuracy: quizAccuracy,
        time_spent: {
          total_hours: totalTimeHours,
          this_week_hours: thisWeekHours,
          daily_average: dailyAverage,
        },
        weak_topics: weakTopics,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load analytics' },
      { status: 500 }
    );
  }
}
