import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import Book from '@studyvault/db/models/Book';
import UserProgress from '@studyvault/db/models/UserProgress';
import { getAuthUser } from '@studyvault/lib/auth/getAuthUser';

/**
 * GET /api/dashboard
 * Returns dashboard data for authenticated users and guests.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser();

    // Fetch live books for the dashboard
    const books = await Book.find({ is_live: true })
      .select('title subject subject_slug program_name board edition_year metadata')
      .lean();

    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          books,
          recentProgress: [],
          totalXP: 0,
          masteredCount: 0,
          level: 1
        }
      });
    }

    // Fetch user progress
    const progress = await UserProgress.find({
      user_id: user.id,
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
    
    // Calculate level from XP (simple formula: level = floor(xp / 100) + 1)
    const level = Math.floor(totalXP / 100) + 1;

    return NextResponse.json({
      success: true,
      data: {
        books,
        recentProgress,
        totalXP,
        masteredCount,
        level
      }
    });
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
