import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import UserProgress from '@studyvault/db/models/UserProgress';
import Topic from '@studyvault/db/models/Topic';
import Program from '@studyvault/db/models/Program';

// Mock user ID - replace with actual auth middleware
const MOCK_USER_ID = '6760c1e5f8a9b2c3d4e5f6a7';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get user's progress data
    const userProgress = await UserProgress.find({ user_id: MOCK_USER_ID })
      .populate('topic_id', 'title subject_name chapter_title')
      .populate('program_id', 'name slug')
      .sort({ last_accessed: -1 });

    // Calculate streak
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    const activitiesToday = userProgress.filter(p => {
      const lastAccessed = new Date(p.last_accessed);
      return lastAccessed >= today;
    });

    const activitiesYesterday = userProgress.filter(p => {
      const lastAccessed = new Date(p.last_accessed);
      return lastAccessed >= yesterday && lastAccessed < today;
    });

    const streakDays = activitiesToday.length > 0 
      ? (activitiesYesterday.length > 0 ? 2 : 1)
      : 0;

    // Calculate total XP
    const totalXP = userProgress.reduce((sum, p) => sum + (p.xp_earned || 0), 0);

    // Determine next action
    let nextAction = null;
    if (userProgress.length > 0) {
      const lastActivity = userProgress[0];
      const lastTopic = lastActivity.topic_id;
      
      if (lastActivity.highest_quiz_score < 60) {
        nextAction = {
          type: 'retry_quiz' as const,
          topic_id: lastTopic._id.toString(),
          topic_title: lastTopic.title,
          message: `Retry ${lastTopic.title} quiz — you were at ${lastActivity.highest_quiz_score}%`,
          progress_percent: lastActivity.progress_percent,
        };
      } else if (lastActivity.highest_quiz_score >= 80) {
        // Find next topic in same chapter
        const currentChapter = lastTopic.chapter_id;
        const nextTopic = await Topic.findOne({
          chapter_id: currentChapter,
          display_order: { $gt: lastTopic.display_order },
          is_live: true,
        }).sort({ display_order: 1 });

        if (nextTopic) {
          nextAction = {
            type: 'continue' as const,
            topic_id: nextTopic._id.toString(),
            topic_title: nextTopic.title,
            message: `Continue to ${nextTopic.title}`,
            progress_percent: lastActivity.progress_percent,
          };
        }
      }

      // If inactive for 2+ days
      const lastAccessedDate = new Date(lastActivity.last_accessed);
      const daysInactive = Math.floor((today.getTime() - lastAccessedDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysInactive >= 2 && !nextAction) {
        nextAction = {
          type: 'review' as const,
          topic_id: lastTopic._id.toString(),
          topic_title: lastTopic.title,
          message: 'Review 5 short questions to keep your streak!',
          progress_percent: lastActivity.progress_percent,
        };
      }
    }

    // Aggregate subject progress
    const programMap = new Map();
    userProgress.forEach(progress => {
      const program = progress.program_id;
      if (!program) return;

      const programId = program._id.toString();
      if (!programMap.has(programId)) {
        programMap.set(programId, {
          _id: programId,
          name: program.name,
          slug: program.slug,
          topics: [],
        });
      }
      programMap.get(programId).topics.push(progress);
    });

    const subjects = Array.from(programMap.values()).map(prog => {
      const totalTopics = prog.topics.length;
      const avgProgress = prog.topics.reduce((sum, t) => sum + (t.progress_percent || 0), 0) / totalTopics;
      const lastAccessed = prog.topics.sort((a, b) => 
        new Date(b.last_accessed).getTime() - new Date(a.last_accessed).getTime()
      )[0];

      return {
        _id: prog._id,
        name: prog.name,
        slug: prog.slug,
        progress_percent: avgProgress,
        last_accessed_chapter: lastAccessed?.topic_id?.chapter_title || 'Not started',
      };
    });

    // Get hot topics (topics with high exam frequency)
    const hotTopics = await Topic.find({
      'exam_frequency.is_hot_topic': true,
      is_live: true,
    })
      .limit(5)
      .select('title subject_name chapter_title exam_frequency')
      .lean();

    const formattedHotTopics = hotTopics.map(topic => {
      const hotData = topic.exam_frequency?.find((ef: any) => ef.is_hot_topic);
      return {
        _id: topic._id.toString(),
        title: topic.title,
        subject_name: topic.subject_name,
        chapter_title: topic.chapter_title,
        exam_appearances: hotData?.total_appearances || 0,
        is_hot_topic: true,
      };
    });

    // Recent activity
    const recentActivity = userProgress.slice(0, 5).map(progress => ({
      _id: progress._id.toString(),
      type: progress.quiz_attempts > 0 ? 'quiz' : 'read' as const,
      topic_title: progress.topic_id?.title || 'Unknown',
      timestamp: progress.last_accessed,
      score: progress.highest_quiz_score,
    }));

    return NextResponse.json({
      success: true,
      data: {
        user: {
          name: 'Student', // Replace with actual user name from auth
          streak_days: streakDays,
          xp_total: totalXP,
          last_active: userProgress[0]?.last_accessed || new Date(),
        },
        next_action: nextAction,
        subjects,
        hot_topics: formattedHotTopics,
        recent_activity: recentActivity,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard stats' },
      { status: 500 }
    );
  }
}
