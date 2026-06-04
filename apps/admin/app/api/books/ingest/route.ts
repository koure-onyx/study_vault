import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import { ingestBook } from '@studyvault/lib/ingestion/ingestBook';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deepseekJson, userId } = body;

    if (!deepseekJson) {
      return NextResponse.json(
        { success: false, error: 'Missing deepseekJson in request body' },
        { status: 400 }
      );
    }

    // Validate basic structure
    if (!deepseekJson.book_metadata || !deepseekJson.chapter || !deepseekJson.topics) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid JSON structure. Expected: { book_metadata, chapter, topics }' 
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Run ingestion (userId should come from authenticated session in real usage)
    // We use a dummy 24-character hex string if no userId is provided so Mongoose validation passes
    const adminUserId = userId || '000000000000000000000000';
    const result = await ingestBook(deepseekJson, adminUserId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Book chapter ingested successfully',
          log: result.log,
          bookId: result.bookId,
          chapterId: result.chapterId,
          programSlug: result.programSlug,
          subjectSlug: result.subjectSlug,
          chapterNumber: result.chapterNumber,
          firstTopicSlug: result.firstTopicSlug,
        },
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          log: result.log,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Ingestion API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ingestion failed' 
      },
      { status: 500 }
    );
  }
}
