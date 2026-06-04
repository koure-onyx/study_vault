import type { Metadata } from 'next';
import { SearchInput } from '@/components/SearchInput';

export const metadata: Metadata = {
  title: 'Browse Topics | StudyVault PK',
  description: 'Search subjects, chapters, and topics across StudyVault.',
};

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-16">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Browse Topics</p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">Search StudyVault</h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600">
            Find subjects, chapters, and topics across your board and program. Start typing to see instant results.
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <SearchInput />
        </div>
      </div>
    </main>
  );
}
