import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import TopicModel from '@studyvault/db/models/Topic';
import ChapterModel from '@studyvault/db/models/Chapter';
import BookModel from '@studyvault/db/models/Book';
import type { IChapter, IBook } from '@studyvault/db/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    await connectDB();
    const { chapterId } = await params;

    const isPreview = request.nextUrl.searchParams.get('preview') === 'true';

    let showAll = isPreview;
    try {
      const chapterDoc = await ChapterModel.findById(chapterId).lean<IChapter | null>();
      if (chapterDoc) {
        const bookDoc = await BookModel.findById(chapterDoc.book_id).lean<IBook | null>();
        if (bookDoc && !bookDoc.is_live) {
          showAll = true;
        }
      }
    } catch (err) {
      console.warn('Failed to resolve book live status for topics API:', err);
    }

    const includeContent = request.nextUrl.searchParams.get('includeContent') === 'true';
    const fields = includeContent
      ? '_id title slug topic_number display_order difficulty estimated_read_time exam_frequency content_blocks key_terms book_mcqs book_problems book_short_questions chapter_id book_id'
      : '_id title slug topic_number display_order difficulty estimated_read_time chapter_id book_id';

    const topics = await TopicModel.find({
      chapter_id: chapterId,
      ...(showAll ? {} : { is_live: true }),
    })
      .sort({ display_order: 1 })
      .select(fields)
      .lean();

    return NextResponse.json({
      success: true,
      data: topics.map((t: any) => ({
        _id: t._id?.toString(),
        chapter_id: t.chapter_id?.toString(),
        book_id: t.book_id?.toString(),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? (error as Error).message : 'Failed to fetch chapter topics' 
      },
      { status: 500 }
    );
  }
}
