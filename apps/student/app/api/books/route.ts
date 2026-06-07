import { NextRequest } from 'next/server';
import connectDB from '@studyvault/db/connect';
import Book from '@studyvault/db/models/Book';
import '@studyvault/db/models/Program';
import '@studyvault/db/models/Board';
import { getAuthUser } from '@studyvault/lib/auth/getAuthUser';
import { buildBookFilter, resolveUserContentProfile } from '@studyvault/lib/content/bookFilter';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser();
    const profile = user
      ? await resolveUserContentProfile(user)
      : null;
    
    // Build filter based on user authentication status
    let filter: any = {};
    
    if (profile) {
      filter = buildBookFilter(profile);
    } else {
      // For unauthenticated users, only show current edition books that are live
      filter = { 
        is_current_edition: { $ne: false },
        is_live: true 
      };
    }

    // Add additional public filtering for unauthenticated users
    if (!user) {
      filter = {
        ...filter,
        is_public: true
      };
    }

    const books = await Book.find(filter)
      .sort({ title: 1 })
      .populate('program_id', 'name slug')
      .populate('board_id', 'name short_code')
      .lean();

    // Filter out sensitive data for unauthenticated users
    const sanitizedBooks = books.map(book => ({
      ...book,
      // Remove sensitive fields for unauthenticated users
      ...(user ? {} : {
        metadata: book.metadata ? {
          ...book.metadata,
          // Remove sensitive metadata
          solutions: undefined,
          answers: undefined,
          teacher_notes: undefined
        } : undefined,
        content_blocks: book.content_blocks ? book.content_blocks.slice(0, 2) : [], // Limit content preview
        seo: book.seo ? {
          ...book.seo,
          meta_description: book.seo.meta_description?.substring(0, 150) + '...' // Truncate descriptions
        } : undefined
      })
    }));

    return Response.json({ success: true, data: { books: sanitizedBooks, isAuthenticated: !!user } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('Books API error:', err);
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
