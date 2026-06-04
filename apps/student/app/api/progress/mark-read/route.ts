import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@studyvault/lib/auth/options';
import { jwtVerify } from 'jose';
import connectDB from '@studyvault/db/connect';
import UserProgress from '@studyvault/db/models/UserProgress';
import Topic from '@studyvault/db/models/Topic';

/**
 * Extract user ID from session or sv_token cookie securely
 */
async function getUserIdFromRequest(request: NextRequest) {
  // Try NextAuth session first
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return { userId: session.user.id, error: null };
  }

  // Fallback to sv_token cookie
  const rawToken = request.cookies.get('sv_token')?.value;
  const secret = process.env.JWT_SECRET;
  
  if (rawToken && secret) {
    try {
      const { payload } = await jwtVerify(rawToken, new TextEncoder().encode(secret));
      const tokenUser = payload as any;
      if (tokenUser?.userId || tokenUser?.sub || tokenUser?.id) {
        return { userId: tokenUser.userId || tokenUser.sub || tokenUser.id, error: null };
      }
    } catch {
      // Token verification failed
    }
  }

  return { userId: null, error: 'Unauthorized' };
}

export async function POST(request: NextRequest) {
  try {
    // SECURE: Extract userId from session/token, NOT from client body
    const { userId, error } = await getUserIdFromRequest(request);
    
    if (!userId || error) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { topicId, isRead = true, scrollDepthPercent = 0, timeSpentSeconds = 0 } = body;

    if (!topicId) {
      return NextResponse.json(
        { success: false, error: 'Missing topicId' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get topic to extract chapter, book, program info
    const topic = await Topic.findById(topicId).lean();
    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Find or create progress record
    let progress = await UserProgress.findOne({ 
      user_id: userId, 
      topic_id: topicId 
    });

    if (progress) {
      // Update existing progress
      progress.is_read = isRead || progress.is_read;
      progress.scroll_depth_percent = Math.max(progress.scroll_depth_percent, scrollDepthPercent);
      progress.time_spent_seconds = (progress.time_spent_seconds || 0) + timeSpentSeconds;
      progress.last_accessed = new Date();
      
      // Recalculate progress percent: 30% reading + 70% quiz
      const quizWeight = 0.7;
      const readingWeight = 0.3;
      const readingScore = progress.is_read ? 100 : 0;
      const quizScore = progress.highest_quiz_score || 0;
      progress.progress_percent = Math.round(
        (readingWeight * readingScore) + (quizWeight * quizScore)
      );
      
      await progress.save();
    } else {
      // Create new progress record
      progress = await UserProgress.create({
        user_id: userId,
        topic_id: topicId,
        chapter_id: topic.chapter_id,
        book_id: topic.book_id,
        program_id: topic.program_id,
        is_read: isRead,
        scroll_depth_percent,
        time_spent_seconds,
        mastery_status: 'in_progress',
        progress_percent: isRead ? 30 : 0, // 30% from reading alone
        xp_earned: isRead ? 10 : 0, // Award 10 XP for marking as read
        last_accessed: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? (error as Error).message : 'Failed to mark as read' 
      },
      { status: 500 }
    );
  }
}
