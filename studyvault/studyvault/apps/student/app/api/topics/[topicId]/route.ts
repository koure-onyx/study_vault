import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import Topic from '@studyvault/db/models/Topic';

export async function GET(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    await connectDB();

    const topic = await Topic.findById(params.topicId)
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

    return NextResponse.json({
      success: true,
      data: topic,
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
