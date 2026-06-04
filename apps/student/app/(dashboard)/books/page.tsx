import Link from 'next/link';
import { BookOpen, Library } from 'lucide-react';
import connectDB from '@studyvault/db/connect';
import Book from '@studyvault/db/models/Book';
import '@studyvault/db/models/Program';
import '@studyvault/db/models/Board';
import { getUser } from '@studyvault/lib/auth/server';
import { buildBookFilter, resolveUserContentProfile } from '@studyvault/lib/content/bookFilter';
import { Card } from '@/components/ui/Card';
import { bookUrl } from '@/lib/reader-urls';

export const dynamic = 'force-dynamic';

export default async function BooksPage() {
  await connectDB();
  const user = await getUser();
  const profile = user ? await resolveUserContentProfile(user) : null;
  const filter = profile ? buildBookFilter(profile) : { is_current_edition: { $ne: false } };

  const books = await (Book as any)
    .find(filter)
    .sort({ title: 1 })
    .populate('program_id', 'name slug')
    .populate('board_id', 'name short_code slug')
    .select('title subject_slug grade slug program_id board_id subject metadata')
    .lean();

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Books</h1>
        <p className="mt-1 text-slate-600">
          {profile?.gradeName
            ? `Books for ${profile.gradeName}${profile.boardName ? ` • ${profile.boardName}` : ''}.`
            : 'Browse available textbooks.'}
        </p>
      </div>

      {books.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <Library className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h2 className="text-lg font-bold text-slate-800">No books found for your profile yet.</h2>
          <p className="mt-2 text-slate-500">
            Check that your board and grade match ingested content, or browse subjects from search.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book: any) => (
            <Link
              key={book._id.toString()}
              href={bookUrl(book.subject_slug || book.slug, { boardSlug: book.board_id?.short_code || book.board_id?.slug, programSlug: book.program_id?.slug })}
              className="group block h-full"
            >
              <Card className="h-full overflow-hidden transition hover:border-emerald-300 hover:shadow-lg">
                <div className="flex h-36 flex-col justify-end bg-slate-900 p-5 text-white">
                  <BookOpen className="mb-auto h-6 w-6 text-emerald-300" />
                  <h2 className="line-clamp-2 text-xl font-bold">{book.title}</h2>
                </div>
                <div className="p-5">
                  <p className="text-sm font-medium text-slate-600">{book.subject}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {book.board_id?.name || book.metadata?.grade_level || profile?.boardName || 'Board'}
                  </p>
                  <span className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white group-hover:bg-emerald-700">
                    Open Book
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
