import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@studyvault/lib/auth/options';
import db from '@studyvault/db/connect';
import Book from '@studyvault/db/models/Book';
import Chapter from '@studyvault/db/models/Chapter';
import Topic from '@studyvault/db/models/Topic';

/**
 * GET /api/admin/courses
 * Returns all books, chapters, and topics with workflow statuses
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    await db();

    const books = await Book.find({})
      .populate({
        path: 'chapters',
        populate: {
          path: 'topics',
          select: 'title slug topic_number workflow_status version_status display_order'
        }
      })
      .select('title slug subject edition_year is_live ingestion_status')
      .lean();

    return NextResponse.json({
      success: true,
      data: books.map(book => ({
        id: book._id,
        title: book.title,
        slug: book.slug,
        subject: book.subject,
        editionYear: book.edition_year,
        isLive: book.is_live,
        ingestionStatus: book.ingestion_status,
        chapters: (book as any).chapters?.map((chapter: any) => ({
          id: chapter._id,
          title: chapter.title,
          slug: chapter.slug,
          chapterNumber: chapter.chapter_number,
          totalTopics: chapter.topics?.length || 0,
          topics: chapter.topics?.map((topic: any) => ({
            id: topic._id,
            title: topic.title,
            slug: topic.slug,
            topicNumber: topic.topic_number,
            workflowStatus: topic.workflow_status,
            versionStatus: topic.version_status,
            displayOrder: topic.display_order
          }))
        }))
      }))
    });

  } catch (error) {
    console.error('[Admin Courses GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
