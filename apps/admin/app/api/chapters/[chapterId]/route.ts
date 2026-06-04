import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import BookModel from '@studyvault/db/models/Book';
import ChapterModel from '@studyvault/db/models/Chapter';
import TopicModel from '@studyvault/db/models/Topic';
import QuestionModel from '@studyvault/db/models/Question';
import UserProgressModel from '@studyvault/db/models/UserProgress';
import UserVaultModel from '@studyvault/db/models/UserVault';

const Book = BookModel as any;
const Chapter = ChapterModel as any;
const Topic = TopicModel as any;
const Question = QuestionModel as any;
const UserProgress = UserProgressModel as any;
const UserVault = UserVaultModel as any;

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    await connectDB();
    const { chapterId } = await params;

    const chapter = await Chapter.findById(chapterId).lean();
    if (!chapter) {
      return NextResponse.json(
        { success: false, error: 'Chapter not found' },
        { status: 404 }
      );
    }

    const topics = await Topic.find({ chapter_id: params.chapterId }).select('_id').lean();
    const topicIds = topics.map((topic: any) => topic._id);

    const [questionResult, progressResult, vaultResult, topicResult] = await Promise.all([
      Question.deleteMany({ $or: [{ chapter_id: params.chapterId }, { topic_id: { $in: topicIds } }] }),
      UserProgress.deleteMany({ $or: [{ chapter_id: params.chapterId }, { topic_id: { $in: topicIds } }] }),
      UserVault.deleteMany({ $or: [{ chapter_id: params.chapterId }, { topic_id: { $in: topicIds } }] }),
      Topic.deleteMany({ chapter_id: params.chapterId }),
    ]);

    await Chapter.findByIdAndDelete(params.chapterId);

    const [totalChapters, totalTopics] = await Promise.all([
      Chapter.countDocuments({ book_id: chapter.book_id }),
      Topic.countDocuments({ book_id: chapter.book_id }),
    ]);

    await Book.findByIdAndUpdate(chapter.book_id, {
      total_chapters: totalChapters,
      total_topics: totalTopics,
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedChapterId: params.chapterId,
        bookId: String(chapter.book_id),
        deletedTopics: topicResult.deletedCount || 0,
        deletedQuestions: questionResult.deletedCount || 0,
        deletedProgressEntries: progressResult.deletedCount || 0,
        deletedVaultItems: vaultResult.deletedCount || 0,
      },
    });
  } catch (error) {
    console.error('Delete chapter error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete chapter',
      },
      { status: 500 }
    );
  }
}
