import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import BookModel from '@studyvault/db/models/Book';
import '@studyvault/db/models/Program';

const Book = BookModel as any;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    await connectDB();
    const { bookId } = await params;

    const book = await Book.findById(bookId)
      .populate('program_id', 'slug')
      .lean();

    if (!book) {
      return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
    }

    const baseUrl = process.env.STUDENT_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/${book.subject_slug || book.slug}?preview=true`;

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
