import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import Topic from '@studyvault/db/models/Topic';

const TopicModel = Topic as any;

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
      const ChapterModel = (await import('@studyvault/db/models/Chapter')).default as any;
      const BookModel = (await import('@studyvault/db/models/Book')).default as any;
      const chapterDoc = await ChapterModel.findById(chapterId).lean();
      if (chapterDoc) {
        const bookDoc = await BookModel.findById(chapterDoc.book_id).lean();
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

    console.log(`\n=== 2. API FETCHED: TOPICS FOR CHAPTER ${chapterId} ===`);
    console.log(JSON.stringify(topics, null, 2));
    console.log('========================================================================\n');

    return NextResponse.json({
      success: true,
      data: topics.map((t: any) => ({
        ...t,
        _id: t._id?.toString(),
        chapter_id: t.chapter_id?.toString(),
        book_id: t.book_id?.toString(),
      })),
    });
  } catch (error) {
    console.error('Get chapter topics error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? (error as Error).message : 'Failed to fetch chapter topics' 
      },
      { status: 500 }
    );
  }
}
