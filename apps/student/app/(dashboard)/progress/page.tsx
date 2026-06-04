import { Card } from '@/components/ui/Card';
import { Target, TrendingUp, Award, BrainCircuit } from 'lucide-react';
import connectDB from '@studyvault/db/connect';
import _UserProgress from '@studyvault/db/models/UserProgress';
import _Book from '@studyvault/db/models/Book';
import { getServerUser } from '@studyvault/lib/auth/server';

const UserProgress = _UserProgress as any;
const Book = _Book as any;

export const dynamic = 'force-dynamic';

export default async function ProgressPage() {
  await connectDB();
  const user = await getServerUser();

  if (!user) return <div className="p-8">Please login.</div>;

  const studentProfile = user.student_profile || {};
  const activeProgramId = studentProfile.active_program_id;

  // Fetch all books for the current program to show mastery per book/subject
  const books = await Book.find({ program_id: activeProgramId, is_live: true }).lean();
  
  // Fetch user progress for these books
  const progressEntries = await UserProgress.find({ 
    user_id: user._id,
    program_id: activeProgramId
  }).lean();

  // Calculate mastery per book
  const subjectMastery = books.map((book: any) => {
    const bookProgress = progressEntries.filter((p: any) => p.book_id?.toString() === book._id.toString());
    const totalTopics = book.total_topics || 1; // Avoid division by zero
    const masteredTopics = bookProgress.filter((p: any) => p.mastery_status === 'mastered').length;
    const progressPercent = Math.min(Math.round((masteredTopics / totalTopics) * 100), 100);

    return {
      name: book.title,
      progress: progressPercent,
      color: progressPercent > 70 ? 'bg-emerald-500' : progressPercent > 30 ? 'bg-cyan-500' : 'bg-slate-300'
    };
  });

  // Calculate overall stats
  const totalCompletedTopics = progressEntries.filter((p: any) => p.is_read).length;
  const avgQuizAccuracy = progressEntries.length > 0 
    ? Math.round(progressEntries.reduce((acc: number, p: any) => acc + (p.highest_quiz_score || 0), 0) / progressEntries.length)
    : 0;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-display text-gray-900">Your Progress</h1>
          <p className="text-gray-500 mt-1">Track your exam readiness across all subjects.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <Award className="w-5 h-5 text-amber-500" />
          <span className="font-bold text-gray-900">Level {Math.floor((studentProfile.xp_total || 0) / 100) + 1} Scholar</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> Subject Mastery
            </h2>
            <div className="space-y-6">
              {subjectMastery.length > 0 ? subjectMastery.map(sub => (
                <div key={sub.name}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">{sub.name}</span>
                    <span className="text-gray-500">{sub.progress}% Mastery</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-2.5 rounded-full ${sub.color}`} style={{ width: `${sub.progress}%` }}></div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-slate-500">
                  Start reading topics to see your mastery here!
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-gradient-to-br from-emerald-900 to-cyan-900 text-white border-0 shadow-lg">
              <Target className="w-8 h-8 text-emerald-200 mb-4" />
              <h3 className="text-xl font-bold mb-1">Weekly Goal</h3>
              <p className="text-emerald-100 mb-4">Complete 10 topics</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold">{progressEntries.filter((p: any) => {
                  const oneWeekAgo = new Date();
                  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                  return p.is_read && new Date(p.updatedAt) > oneWeekAgo;
                }).length}</span>
                <span className="text-emerald-200 mb-1">/ 10 completed</span>
              </div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-indigo-900 to-blue-900 text-white border-0 shadow-lg">
              <BrainCircuit className="w-8 h-8 text-indigo-200 mb-4" />
              <h3 className="text-xl font-bold mb-1">Quiz Accuracy</h3>
              <p className="text-indigo-100 mb-4">Global average</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold">{avgQuizAccuracy}%</span>
                <span className="text-indigo-200 mb-1">average</span>
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {progressEntries.slice(0, 5).sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((p: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Topic Progress</p>
                    <p className="text-xs text-gray-500">{new Date(p.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-sm">
                    {p.mastery_status === 'mastered' ? 'Mastered' : 'In Progress'}
                  </div>
                </div>
              ))}
              {progressEntries.length === 0 && (
                <p className="text-center text-slate-500 py-4 text-sm">No recent activity found.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
