import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import Book from '@studyvault/db/models/Book';
import UserProgress from '@studyvault/db/models/UserProgress';
import Topic from '@studyvault/db/models/Topic';
import UserVault from '@studyvault/db/models/UserVault';
import { getAuthUser } from '@studyvault/lib/auth/getAuthUser';
import { successResponse, errorResponse } from '@studyvault/lib/utils/api-response';

/**
 * GET /api/dashboard
 * Returns complete dashboard data for authenticated users.
 * For guests, returns only books list.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser();

    // Fetch live books for the dashboard
    const books = await Book.find({ is_live: true })
      .select('title subject subject_slug subject_icon program_name board board_slug program_slug edition_year metadata')
      .lean();

    // Guest users only get books list
    if (!user) {
      return successResponse({
        books,
        recentChapters: [],
        stats: {
          examReadiness: 0,
          topicsMastered: 0,
          xpThisWeek: 0,
          currentLevel: 1,
          xpToNextLevel: 100,
          streakDays: 0,
          topicsStudied: 0,
          studiedDays: [false, false, false, false, false, false, false],
        },
        hotTopics: [],
        vaultItems: [],
        recentQuizzes: [],
        firstName: 'Guest',
      });
    }

    // Fetch user progress data
    const progress = await UserProgress.find({ user_id: user.id })
      .sort({ updated_at: -1 })
      .limit(10)
      .lean();

    // Calculate stats
    const totalXP = progress.reduce((sum: number, p: any) => sum + (p.xp_earned || 0), 0);
    const masteredCount = progress.filter((p: any) => p.mastered || p.completed).length;
    const level = Math.floor(totalXP / 100) + 1;
    const xpToNextLevel = ((level) * 100) - totalXP;

    // Get recent chapters with book info
    const recentChapterIds = [...new Set(progress.map((p: any) => p.chapter_id).filter(Boolean))];
    const recentChaptersData = await Promise.all(
      recentChapterIds.slice(0, 3).map(async (chapterId: string) => {
        const ChapterModel = (await import('@studyvault/db/models/Chapter')).default;
        const chapter = await ChapterModel.findById(chapterId).select('title book_id').lean();
        if (!chapter) return null;
        
        const BookModel = (await import('@studyvault/db/models/Book')).default;
        const book = await BookModel.findById(chapter.book_id).select('title').lean();
        
        const chapterProgress = progress.filter((p: any) => p.chapter_id === chapterId);
        const totalTopics = chapterProgress.length;
        const completedTopics = chapterProgress.filter((p: any) => p.completed || p.mastered).length;
        const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

        return {
          _id: chapterId,
          bookTitle: book?.title || 'Unknown Book',
          chapterTitle: chapter.title,
          progress: progressPercent,
          href: `/reader/${book?.subject_slug || 'book'}/chapter-${chapterId}`,
        };
      })
    );
    const recentChapters = recentChaptersData.filter(Boolean);

    // Get hot topics (high exam frequency)
    const hotTopics = await Topic.find({ 
      is_live: true,
      exam_frequency_count: { $gte: 3 }
    })
      .select('title exam_frequency_count slug')
      .sort({ exam_frequency_count: -1 })
      .limit(4)
      .lean();

    // Get vault items
    const vaultItems = await UserVault.find({ user_id: user.id })
      .sort({ created_at: -1 })
      .limit(5)
      .lean();

    const vaultItemsWithDetails = await Promise.all(
      vaultItems.map(async (item: any) => {
        const topic = await Topic.findById(item.topic_id).select('title').lean();
        return {
          _id: item._id.toString(),
          topicTitle: topic?.title || 'Unknown Topic',
          itemType: item.item_type as 'flashcard' | 'bookmark' | 'note',
          createdAt: item.created_at,
        };
      })
    );

    // Mock quiz data (until quiz history is implemented)
    const recentQuizzes = [];

    // Calculate exam readiness (simplified: based on mastered topics ratio)
    const examReadiness = Math.min(100, Math.round((masteredCount / 50) * 100));

    // Calculate streak (simplified - would need last_activity tracking)
    const streakDays = 0;

    return successResponse({
      books,
      recentChapters,
      stats: {
        examReadiness,
        topicsMastered: masteredCount,
        xpThisWeek: totalXP,
        currentLevel: level,
        xpToNextLevel,
        streakDays,
        topicsStudied: progress.length,
        studiedDays: [false, false, false, false, false, false, false],
      },
      hotTopics,
      vaultItems: vaultItemsWithDetails,
      recentQuizzes,
      firstName: user.name?.split(' ')[0] || 'Student',
    });
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
