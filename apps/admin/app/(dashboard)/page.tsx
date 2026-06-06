import { Card } from '@/components/ui/Card';
import { Users, BookOpen, FileText, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import connectDB from '@studyvault/db/connect';
import _User from '@studyvault/db/models/User';
import _Book from '@studyvault/db/models/Book';
import _Topic from '@studyvault/db/models/Topic';
import '@studyvault/db/models/Program';

export const dynamic = 'force-dynamic';

const User = _User as any;
const Book = _Book as any;
const Topic = _Topic as any;

export default async function AdminDashboardPage() {
  await connectDB();

  const [studentCount, bookCount, topicCount, pendingTopics] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Book.countDocuments(),
    Topic.countDocuments(),
    Topic.countDocuments({ workflow_status: 'pending_review' })
  ]);

  const studentAppUrl = process.env.STUDENT_APP_URL || 'http://localhost:3000';

  const recentBooks = await Book.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('program_id', 'name slug')
    .lean();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
          Admin Command Center
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Real-time overview of StudyVault ecosystem.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 flex items-center gap-4 border-l-4 border-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
            <p className="text-3xl font-black text-slate-900">{studentCount}</p>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4 border-l-4 border-cyan-500 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-3 bg-cyan-50 rounded-2xl text-cyan-600">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Books Ingested</p>
            <p className="text-3xl font-black text-slate-900">{bookCount}</p>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4 border-l-4 border-indigo-500 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Topics</p>
            <p className="text-3xl font-black text-slate-900">{topicCount}</p>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4 border-l-4 border-orange-500 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Pending Review</p>
            <p className="text-3xl font-black text-slate-900">{pendingTopics}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-0 shadow-xl rounded-3xl">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" /> Recent Book Ingestions
              </h2>
              <div className="flex items-center gap-4">
                <a href="/books" className="text-sm font-bold text-cyan-300 hover:underline">Manage Books</a>
                <a href="/books/ingest" className="text-sm font-bold text-emerald-400 hover:underline">New Ingestion</a>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {recentBooks.map((book: any) => (
                <div key={book._id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">{book.title}</h3>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">
                      {book.program_id?.name} • {book.subject}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      book.is_live ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {book.is_live ? 'Live' : 'Draft'}
                    </span>
                    <a
                      href={`${studentAppUrl}/${book.subject_slug || book.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Preview
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-0 shadow-xl rounded-3xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Content Status
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-indigo-100">Live Content</span>
                <span className="font-black text-2xl">85%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div className="bg-white h-full rounded-full" style={{ width: '85%' }}></div>
              </div>
              <p className="text-xs text-indigo-200 leading-relaxed mt-4">
                You have {pendingTopics} topics waiting for your final approval.
              </p>
              <a href="/content" className="block w-full py-3 bg-white text-indigo-700 text-center rounded-xl font-bold hover:bg-indigo-50 transition-colors mt-4">
                Open Review Panel
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
  );
}
