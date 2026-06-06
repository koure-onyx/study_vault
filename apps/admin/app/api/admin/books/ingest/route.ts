import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@studyvault/lib/auth/options';
import { processBookIngestion } from '@studyvault/lib/ingestion/IngestionEngine';

interface IngestionData {
  book_metadata: {
    title: string;
    grade_level: string;
    board: string;
    subject: string;
    description?: string;
    cover_image_url?: string;
  };
  chapter: {
    title: string;
    number: number;
    description?: string;
  };
  topics: Array<{
    title: string;
    number: number;
    content_html: string;
    key_terms?: Array<string | { term: string; definition: string }>;
    learning_objectives?: string[];
    summary?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    /*
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin role - Zero-Trust Identity Guarding
    const userRole = session.user.role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required. Client-supplied identifiers rejected.' },
        { status: 403 }
      );
    }
    */

    // Parse request body
    let data: IngestionData;
    try {
      data = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!data.book_metadata?.title || 
        !data.book_metadata?.grade_level || 
        !data.book_metadata?.board || 
        !data.book_metadata?.subject) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required metadata: title, grade_level, board, and subject are required' 
        },
        { status: 400 }
      );
    }

    if (!data.chapter || !Array.isArray(data.topics)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid structure: chapter object and topics array are required' 
        },
        { status: 400 }
      );
    }

    // Execute ingestion
    const result = await processBookIngestion(data);

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    console.error('[ADMIN BOOKS INGEST API ERROR]', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Internal server error: ${error.message}` 
      },
      { status: 500 }
    );
  }
}
