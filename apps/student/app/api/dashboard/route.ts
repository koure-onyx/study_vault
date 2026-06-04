import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@studyvault/lib/auth/options';
import { jwtVerify } from 'jose';
import connectDB from '@studyvault/db/connect';
import Book from '@studyvault/db/models/Book';
import UserProgress from '@studyvault/db/models/UserProgress';

/**
 * Extract user ID from session or sv_token cookie
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

/**
 * GET /api/dashboard
 * Returns dashboard data for authenticated users
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdFromRequest(request);
    
    if (!userId || error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Fetch live books for the dashboard
    const books = await Book.find({ is_live: true })
      .select('title subject subject_slug program_name board edition_year metadata')
      .lean();

    // Fetch user progress
    const progress = await UserProgress.find({ 
      user_id: userId 
    })
      .sort({ updated_at: -1 })
      .limit(5)
      .lean();
    
    const recentProgress = progress.map((p: any) => ({
      chapterId: p.chapter_id,
      topicId: p.topic_id,
      xpEarned: p.xp_earned || 0,
      completed: p.mastered || p.completed || false,
      updatedAt: p.updated_at,
    }));

    const totalXP = progress.reduce((sum: number, p: any) => sum + (p.xp_earned || 0), 0);
    const masteredCount = progress.filter((p: any) => p.mastered || p.completed).length;

    return NextResponse.json({
      books,
      recentProgress,
      totalXP,
      masteredCount,
    });
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
