import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import BookModel from '@studyvault/db/models/Book';

const Book = BookModel as any;

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
