import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookOpen, Filter, Library } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import connectDB from '@studyvault/db/connect';
import _Book from '@studyvault/db/models/Book';
import '@studyvault/db/models/Program';
import '@studyvault/db/models/Board';
import { getUser } from '@studyvault/lib/auth/server';
import { buildBookFilter, resolveUserContentProfile } from '@studyvault/lib/content/bookFilter';
import { SearchInput } from '@/components/SearchInput';
import { bookUrl } from '@/lib/reader-urls';

const Book = _Book as any;

export const dynamic = 'force-dynamic';

export default async function MyVaultPage({ searchParams }: { searchParams: { programId?: string, boardId?: string } }) {
  await connectDB();
  const user = await getUser();

  if (!user) {
    redirect('/login?next=/my-vault');
  }

  const contentProfile = await resolveUserContentProfile(user);
  const bookFilter = buildBookFilter(contentProfile);

  const books = await Book.find(bookFilter)
    .sort({ title: 1 })
    .populate('program_id', 'name slug')
    .populate('board_id', 'name short_code slug')
    .select('title subject_slug grade slug program_id board_id')
    .lean();

  const totalBooks = books.length;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">My Library</h1>
          <p className="text-slate-500 mt-1">Your collection of official board textbooks and study materials.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <SearchInput programId={contentProfile.programId?.toString()} />
          </div>
          <Button variant="outline" className="shrink-0"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1 space-y-2">
          <div className="bg-emerald-50 text-emerald-800 font-medium px-4 py-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors shadow-sm border border-emerald-100">
            <div className="flex items-center gap-3">
              <Library className="w-5 h-5" />
              All Books
            </div>
            <span className="bg-emerald-200 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">{totalBooks}</span>
          </div>
          <div className="text-slate-600 hover:bg-slate-50 font-medium px-4 py-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors">
            <BookOpen className="w-5 h-5 opacity-60" />
            Recently Read
          </div>
        </div>

        {/* Content Grid */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {books.map((book: any) => (
            <Link 
              key={book._id.toString()} 
              href={bookUrl(book.subject_slug || 'subject', { boardSlug: book.board_id?.short_code || book.board_id?.slug, programSlug: book.program_id?.slug })}
              className="block group"
            >
              <Card className="h-full overflow-hidden hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300">
                <div className="h-40 bg-gradient-to-br from-emerald-800 to-cyan-900 p-6 flex flex-col justify-end relative overflow-hidden">
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -right-6 -bottom-6 opacity-10">
                    <BookOpen className="w-32 h-32 text-white" />
                  </div>
                  <span className="text-xs font-bold text-emerald-100 bg-emerald-900/50 backdrop-blur-sm px-2.5 py-1 rounded-full self-start mb-auto">
                    {book.board_id?.name || 'Board'}
                  </span>
                  <h3 className="font-display font-bold text-xl text-white leading-tight mt-4">
                    {book.title}
                  </h3>
                </div>
                <div className="p-5 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                      {book.program_id?.name || 'Program'}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">
                      {book.metadata?.language === 'urdu' ? 'Urdu' : 'English'} Medium
                    </span>
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Chapters</span>
                      <span className="font-semibold text-slate-700">{book.total_chapters || 0}</span>
                    </div>
                  </div>
                  <span className="flex w-full items-center justify-center rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white">
                    Open Book
                  </span>
                </div>
              </Card>
            </Link>
          ))}
          
          {books.length === 0 && (
            <div className="col-span-2 text-center py-20 bg-slate-50 border border-dashed rounded-2xl border-slate-300">
              <Library className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">No Books Found</h3>
              <p className="text-slate-500">
                We couldn&apos;t find any books for {contentProfile.gradeName || 'your grade'}
                {contentProfile.boardName ? ` (${contentProfile.boardName})` : ''}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
