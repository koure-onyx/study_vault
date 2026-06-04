import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import Topic from '@studyvault/db/models/Topic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const resolvedParams = await params;
    
    await connectDB();

    const currentTopic = await Topic.findById(resolvedParams.topicId).lean();
    
    if (!currentTopic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Find previous topic (same chapter, lower display_order)
    const previousTopic = await Topic.findOne({
      chapter_id: currentTopic.chapter_id,
      display_order: { $lt: currentTopic.display_order },
      is_live: true,
    })
      .sort({ display_order: -1 })
      .select('_id title slug display_order')
      .lean();

    // Find next topic (same chapter, higher display_order)
    const nextTopic = await Topic.findOne({
      chapter_id: currentTopic.chapter_id,
      display_order: { $gt: currentTopic.display_order },
      is_live: true,
    })
      .sort({ display_order: 1 })
      .select('_id title slug display_order')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        previous: previousTopic ? {
          _id: previousTopic._id,
          title: previousTopic.title,
          slug: previousTopic.slug,
        } : null,
        next: nextTopic ? {
          _id: nextTopic._id,
          title: nextTopic.title,
          slug: nextTopic.slug,
        } : null,
      },
    });
  } catch (error) {
    console.error('Get adjacent topics error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? (error as Error).message : 'Failed to fetch adjacent topics' 
      },
      { status: 500 }
    );
  }
}
