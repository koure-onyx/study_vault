import { NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import BookModel from '@studyvault/db/models/Book';
import ChapterModel from '@studyvault/db/models/Chapter';
import TopicModel from '@studyvault/db/models/Topic';
import '@studyvault/db/models/Program';
import '@studyvault/db/models/Board';

const Book = BookModel as any;
const Chapter = ChapterModel as any;
const Topic = TopicModel as any;

export async function GET() {
  try {
    await connectDB();

    const books = await Book.find()
      .sort({ createdAt: -1 })
      .populate('program_id', 'name slug')
      .populate('board_id', 'name short_code')
      .lean();

    const bookIds = books.map((book: any) => book._id);

    const [chapters, topicCounts] = await Promise.all([
      Chapter.find({ book_id: { $in: bookIds } })
        .sort({ book_id: 1, chapter_number: 1 })
        .lean(),
      Topic.aggregate([
        { $match: { book_id: { $in: bookIds } } },
        { $group: { _id: '$chapter_id', count: { $sum: 1 } } },
      ]),
    ]);

    const topicCountByChapter = new Map(
      topicCounts.map((entry: any) => [String(entry._id), entry.count])
    );

    const chaptersByBook = new Map<string, any[]>();
    chapters.forEach((chapter: any) => {
      const bookId = String(chapter.book_id);
      const chapterList = chaptersByBook.get(bookId) || [];
      chapterList.push({
        ...chapter,
        topic_count: topicCountByChapter.get(String(chapter._id)) || 0,
      });
      chaptersByBook.set(bookId, chapterList);
    });

    return NextResponse.json({
      success: true,
      data: books.map((book: any) => ({
        ...book,
        chapters: chaptersByBook.get(String(book._id)) || [],
      })),
    });
  } catch (error) {
    console.error('List books error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load books',
      },
      { status: 500 }
    );
  }
}
