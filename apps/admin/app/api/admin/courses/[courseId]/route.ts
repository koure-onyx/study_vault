import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@studyvault/lib/auth/options';
import connectDB from '@studyvault/db/connect';
import Book from '@studyvault/db/models/Book';
import Chapter from '@studyvault/db/models/Chapter';
import Topic from '@studyvault/db/models/Topic';

/**
 * PATCH /api/admin/courses/[courseId]
 * Update course or topic workflow status
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
const { courseId } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { type, workflowStatus, topicId } = body;

    // Validate workflow status
    const validStatuses = ['draft', 'pending_review', 'live', 'rejected'];
    if (workflowStatus && !validStatuses.includes(workflowStatus)) {
      return NextResponse.json(
        { error: `Invalid workflow status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    let result;

    if (type === 'topic' && topicId) {
      // Update a specific topic's workflow status
      result = await Topic.findByIdAndUpdate(
        topicId,
        { workflow_status: workflowStatus },
        { new: true, runValidators: true }
      ).populate('chapter_id book_id');
    } else if (type === 'chapter') {
      // Update all topics in a chapter
      result = await Topic.updateMany(
        { chapter_id: params.courseId },
        { workflow_status: workflowStatus }
      );
    } else if (type === 'book') {
      // Update book live status
      result = await Book.findByIdAndUpdate(
        params.courseId,
        { is_live: workflowStatus === 'live' },
        { new: true, runValidators: true }
      );
    } else {
      // Default: update chapter workflow status (affects topics)
      result = await Chapter.findByIdAndUpdate(
        params.courseId,
        {},
        { new: true, runValidators: true }
      ).populate('topics');
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[Admin Course PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update course', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
