import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import Topic from '@studyvault/db/models/Topic';
import '@studyvault/db/models/Chapter';
import '@studyvault/db/models/Book';
import '@studyvault/db/models/Program';
import '@studyvault/db/models/Board';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    await connectDB();
    const { topicId } = await params;

    const topic = await Topic.findById(topicId)
      .populate('chapter_id', 'title chapter_number slug')
      .populate('book_id', 'title subject slug edition_year')
      .populate('program_id', 'name slug')
      .populate('board_id', 'name short_code')
      .lean();

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Check if topic is live (for non-preview requests)
    const isPreview = request.nextUrl.searchParams.get('preview') === 'true';
    if (!topic.is_live && !isPreview) {
      return NextResponse.json(
        { success: false, error: 'Topic not published yet' },
        { status: 403 }
      );
    }

    // Find previous topic (same chapter, lower display_order)
    const previousTopic = await Topic.findOne({
      chapter_id: topic.chapter_id,
      display_order: { $lt: topic.display_order },
      is_live: true,
    })
      .sort({ display_order: -1 })
      .select('_id title slug display_order')
      .lean();

    // Find next topic (same chapter, higher display_order)
    const nextTopic = await Topic.findOne({
      chapter_id: topic.chapter_id,
      display_order: { $gt: topic.display_order },
      is_live: true,
    })
      .sort({ display_order: 1 })
      .select('_id title slug display_order')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        topic,
        previousTopic: previousTopic ? {
          _id: previousTopic._id?.toString(),
          title: previousTopic.title,
          slug: previousTopic.slug,
        } : null,
        nextTopic: nextTopic ? {
          _id: nextTopic._id?.toString(),
          title: nextTopic.title,
          slug: nextTopic.slug,
        } : null,
      },
    });
  } catch (error) {
    console.error('Get topic error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? (error as Error).message : 'Failed to fetch topic' 
      },
      { status: 500 }
    );
  }
}
