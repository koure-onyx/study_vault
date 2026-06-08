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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    await connectDB();
    const { bookId } = await params;

    const book = await Book.findById(bookId).lean();
    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    // Fetch chapters for this book
    const chapters = await Chapter.find({ book_id: bookId })
      .sort({ chapter_number: 1 })
      .lean();

    // Fetch topics for each chapter
    const chaptersWithTopics = await Promise.all(
      chapters.map(async (chapter: any) => {
        const topics = await Topic.find({ chapter_id: chapter._id })
          .sort({ display_order: 1 })
          .select('_id title slug topic_number raw_text clean_html content_blocks')
          .lean();
        
        return {
          ...chapter,
          topics,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        ...book,
        chapters: chaptersWithTopics,
      },
    });
  } catch (error) {
    console.error('Get book preview error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch book',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    await connectDB();
    const { bookId } = await params;

    const book = await Book.findById(bookId).lean();
    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    const chapters = await Chapter.find({ book_id: params.bookId }).select('_id').lean();
    const chapterIds = chapters.map((chapter: any) => chapter._id);
    const topics = await Topic.find({ book_id: params.bookId }).select('_id').lean();
    const topicIds = topics.map((topic: any) => topic._id);

    const [
      questionResult,
      progressResult,
      vaultResult,
      topicResult,
      chapterResult,
    ] = await Promise.all([
      Question.deleteMany({ $or: [{ book_id: params.bookId }, { topic_id: { $in: topicIds } }] }),
      UserProgress.deleteMany({ $or: [{ book_id: params.bookId }, { topic_id: { $in: topicIds } }] }),
      UserVault.deleteMany({ $or: [{ chapter_id: { $in: chapterIds } }, { topic_id: { $in: topicIds } }] }),
      Topic.deleteMany({ book_id: params.bookId }),
      Chapter.deleteMany({ book_id: params.bookId }),
    ]);

    await Book.findByIdAndDelete(params.bookId);

    return NextResponse.json({
      success: true,
      data: {
        deletedBookId: params.bookId,
        deletedChapters: chapterResult.deletedCount || 0,
        deletedTopics: topicResult.deletedCount || 0,
        deletedQuestions: questionResult.deletedCount || 0,
        deletedProgressEntries: progressResult.deletedCount || 0,
        deletedVaultItems: vaultResult.deletedCount || 0,
      },
    });
  } catch (error) {
    console.error('Delete book error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete book',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    await connectDB();
    const { bookId } = await params;
    
    const body = await request.json();
    const { is_live } = body;
    
    if (typeof is_live !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'is_live must be a boolean' },
        { status: 400 }
      );
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    book.is_live = is_live;
    await book.save();

    return NextResponse.json({
      success: true,
      data: {
        bookId: book._id.toString(),
        is_live: book.is_live,
      },
    });
  } catch (error) {
    console.error('Toggle book live status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update book status',
      },
      { status: 500 }
    );
  }
}
