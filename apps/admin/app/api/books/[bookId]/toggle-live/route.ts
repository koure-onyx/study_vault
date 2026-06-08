import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@studyvault/lib/auth/options';
import connectDB from '@studyvault/db/connect';
import Book from '@studyvault/db/models/Book';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const session = await getServerSession(await authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { bookId } = await params;
    const body = await request.json();
    const { is_live } = body;

    if (typeof is_live !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'is_live must be a boolean' },
        { status: 400 }
      );
    }

    await connectDB();

    const book = await Book.findByIdAndUpdate(
      bookId,
      { is_live },
      { new: true }
    );

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { book },
    });
  } catch (error) {
    console.error('Failed to toggle book live status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update book status',
      },
      { status: 500 }
    );
  }
}
