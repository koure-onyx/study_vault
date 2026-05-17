import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import UserProgress from '@studyvault/db/models/UserProgress';
import Topic from '@studyvault/db/models/Topic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const programId = searchParams.get('programId');

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Build search query
    const searchQuery: any = {
      is_live: true,
      $text: { $search: query },
    };

    if (programId) {
      searchQuery.program_id = programId;
    }

    // Perform text search
    const topics = await Topic.find(searchQuery)
      .select('title slug subject_name chapter_number chapter_title exam_frequency keywords')
      .limit(limit)
      .lean();

    // Format results
    const results = topics.map((topic: any) => {
      const hotData = topic.exam_frequency?.find((ef: any) => ef.is_hot_topic);
      
      return {
        _id: topic._id.toString(),
        type: 'topic' as const,
        title: topic.title,
        breadcrumb: `${topic.subject_name} > Ch ${topic.chapter_number}: ${topic.chapter_title}`,
        exam_stat: hotData ? `Appeared ${hotData.total_appearances}x in ${hotData.board_name}` : undefined,
        is_hot_topic: !!hotData,
      };
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
