import { NextRequest } from 'next/server';
import connectDB from '@studyvault/db/connect';
import Book from '@studyvault/db/models/Book';
import '@studyvault/db/models/Program';
import '@studyvault/db/models/Board';
import { getUser } from '@studyvault/lib/auth/server';
import { buildBookFilter, resolveUserContentProfile } from '@studyvault/lib/content/bookFilter';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getUser();
    const profile = user
      ? await resolveUserContentProfile(user)
      : null;
    const filter = profile
      ? buildBookFilter(profile)
      : { is_current_edition: { $ne: false } };

    const books = await Book.find(filter)
      .sort({ title: 1 })
      .populate('program_id', 'name slug')
      .populate('board_id', 'name short_code')
      .lean();

    return Response.json({ success: true, data: { books } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
