import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import TopicModel from '@studyvault/db/models/Topic';
import '@studyvault/db/models/Chapter';
import '@studyvault/db/models/Book';
import '@studyvault/db/models/Program';

const Topic = TopicModel as any;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    await connectDB();
    const { topicId } = await params;

    const topic = await Topic.findById(topicId)
      .populate('program_id', 'slug')
      .populate('book_id', 'subject_slug')
      .populate('chapter_id', 'chapter_number')
      .lean();

    if (!topic) {
      return NextResponse.json({ success: false, error: 'Topic not found' }, { status: 404 });
    }

    const subjectSlug = topic.book_id?.subject_slug || 'subject';
    const chapterNumber = topic.chapter_id?.chapter_number || topic.chapter_number || 1;
    const baseUrl = process.env.STUDENT_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/${subjectSlug}/chapter-${chapterNumber}/${topic.slug}?preview=true`;

    return NextResponse.json({ success: true, data: { url } });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build preview URL',
      },
      { status: 500 }
    );
  }
}
