import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import Topic from '@studyvault/db/models/Topic';
import Chapter from '@studyvault/db/models/Chapter';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chapterId = searchParams.get('chapterId');
    const status = searchParams.get('status') || 'draft,pending_review';

    await connectDB();

    let query: any = {};
    
    if (chapterId) {
      query.chapter_id = chapterId;
    }
    
    if (status) {
      query.workflow_status = { $in: status.split(',') };
    }

    const topics = await Topic.find(query)
      .populate('chapter_id', 'title chapter_number')
      .populate('book_id', 'title subject')
      .sort({ display_order: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: topics,
    });
  } catch (error) {
    console.error('Get topics error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch topics' 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicId, action, notes, topicIds } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Missing action' },
        { status: 400 }
      );
    }

    await connectDB();

    if (action === 'bulk_approve') {
      if (!Array.isArray(topicIds)) {
        return NextResponse.json(
          { success: false, error: 'topicIds must be an array for bulk approve' },
          { status: 400 }
        );
      }

      const result = await Topic.updateMany(
        { _id: { $in: topicIds } },
        {
          workflow_status: 'live',
          is_live: true,
          approved_at: new Date(),
        }
      );

      return NextResponse.json({
        success: true,
        data: {
          message: `Approved ${result.modifiedCount} topics`,
          modifiedCount: result.modifiedCount,
        },
      });
    }

    // Single topic action
    if (!topicId) {
      return NextResponse.json(
        { success: false, error: 'Missing topicId' },
        { status: 400 }
      );
    }

    let updateData: any = {};

    if (action === 'approve') {
      updateData = {
        workflow_status: 'live',
        is_live: true,
        approved_at: new Date(),
        ...(notes && { admin_notes: notes }),
      };
    } else if (action === 'reject') {
      updateData = {
        workflow_status: 'rejected',
        is_live: false,
        ...(notes && { admin_notes: notes }),
      };
    }

    const topic = await Topic.findByIdAndUpdate(
      topicId,
      updateData,
      { new: true }
    );

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      );
    }

    // If approving a topic, check if all topics in chapter are approved
    if (action === 'approve') {
      const chapterTopics = await Topic.find({ chapter_id: topic.chapter_id });
      const allApproved = chapterTopics.every((t: any) => t.workflow_status === 'live');
      
      if (allApproved) {
        await Chapter.findByIdAndUpdate(topic.chapter_id, { is_live: true });
      }
    }

    return NextResponse.json({
      success: true,
      data: topic,
    });
  } catch (error) {
    console.error('Update topic error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? (error as Error).message : 'Failed to update topic' 
      },
      { status: 500 }
    );
  }
}
