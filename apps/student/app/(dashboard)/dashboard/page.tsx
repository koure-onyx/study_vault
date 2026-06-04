'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const springPresets = {
  softCard: { stiffness: 100, damping: 15, mass: 1.0 },
  snappyButton: { stiffness: 400, damping: 20, mass: 0.5 },
  toastEntry: { stiffness: 300, damping: 25, mass: 0.8 },
  activePill: { stiffness: 350, damping: 30, mass: 0.6 },
};

interface Book {
  _id: string;
  title: string;
  subject: string;
  subject_slug: string;
  program_name: string;
  board: string;
  edition_year: number;
  total_chapters: number;
  total_topics: number;
  is_live: boolean;
  metadata?: { grade_level?: string; authors?: string[] };
}

interface DashboardData {
  books: Book[];
  recentProgress: any[];
  totalXP: number;
  masteredCount: number;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white/5 dark:bg-gray-800/5 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 h-64">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl mb-4" />
            <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-3/4 mb-3" />
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-1/2 mb-6" />
            <div className="space-y-2">
              <div className="flex items-center gap-3"><div className="w-4 h-4 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full" /><div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded flex-1" /></div>
              <div className="flex items-center gap-3 pl-4"><div className="w-3 h-3 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full" /><div className="h-2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded flex-1" /></div>
              <div className="flex items-center gap-3 pl-4"><div className="w-3 h-3 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full" /><div className="h-2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded flex-1" /></div>
            </div>
            <div className="mt-6 flex gap-4"><div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg w-20" /><div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg w-20" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springPresets.toastEntry} className="flex flex-col items-center justify-center py-20 px-6">
      <motion.div animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="relative mb-8">
        <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-2xl">
          <defs><linearGradient id="vaultGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="hsl(262, 83%, 58%)" stopOpacity="0.9" /><stop offset="100%" stopColor="hsl(280, 100%, 50%)" stopOpacity="0.9" /></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          <motion.rect x="40" y="60" width="120" height="100" rx="12" fill="url(#vaultGradient)" filter="url(#glow)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.2 }} />
          <motion.circle cx="100" cy="110" r="35" fill="hsla(270, 90%, 60%, 0.3)" stroke="hsl(270, 100%, 70%)" strokeWidth="3" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, ...springPresets.snappyButton }} />
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}><rect x="85" y="95" width="30" height="25" rx="4" fill="hsl(270, 100%, 80%)" /><path d="M90 95 V85 A10 10 0 0 1 110 85 V95" stroke="hsl(270, 100%, 80%)" strokeWidth="4" fill="none" /></motion.g>
          {[...Array(6)].map((_, i) => (<motion.circle key={i} cx={60 + Math.random() * 80} cy={70 + Math.random() * 80} r={2 + Math.random() * 3} fill="hsl(270, 100%, 90%)" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -10, 0] }} transition={{ duration: 1.5, delay: 1.5 + (i * 0.2), repeat: Infinity, repeatDelay: 0.5 }} />))}
        </svg>
      </motion.div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 text-center">Your Study Vault is Empty</h2>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">Start your learning journey by exploring our collection of board-approved textbooks and resources.</p>
      <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
        <Link href="/books" className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-[0_0_30px_hsla(270,90%,60%,0.4)] hover:shadow-[0_0_50px_hsla(270,90%,60%,0.6)] transition-all duration-300">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
          Explore Books
        </Link>
      </motion.div>
    </motion.div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const handleRetry = useCallback(() => { if (retryCount < maxRetries) { setRetryCount(prev => prev + 1); onRetry(); } }, [retryCount, onRetry]);
  useEffect(() => { const timer = setInterval(() => { if (retryCount < maxRetries) handleRetry(); else clearInterval(timer); }, 5000); return () => clearInterval(timer); }, [retryCount, handleRetry, maxRetries]);
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={springPresets.toastEntry} className="bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0"><svg width="40" height="40" viewBox="0 0 40 40" className="text-red-500"><circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.1" /><path d="M20 10 L20 22 M20 28 L20 30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /><circle cx="20" cy="34" r="2" fill="currentColor" /></svg></div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Unable to Load Dashboard</h3>
          <p className="text-red-600 dark:text-red-300 text-sm mb-4">{error || 'An unexpected error occurred while fetching your data.'}</p>
          {retryCount < maxRetries && <p className="text-xs text-red-500 dark:text-red-400 mb-4">Auto-retrying in 5s... (Attempt {retryCount + 1} of {maxRetries})</p>}
          <div className="flex gap-3">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={springPresets.snappyButton} onClick={handleRetry} disabled={retryCount >= maxRetries} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors">{retryCount >= maxRetries ? 'Max Retries Reached' : 'Retry Now'}</motion.button>
            <Link href="/" className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-xl transition-colors">Go Home</Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BookCard({ book, index }: { book: Book; index: number }) {
  const router = useRouter();
  const gridColumn = index % 7 === 0 ? 'span 2' : 'span 1';
  const gridRow = index % 5 === 0 ? 'span 2' : 'span 1';
  const baseShadow = '0 4px 30px hsla(270, 90%, 60%, 0.1)';
  const hoverShadow = '0 12px 60px hsla(270, 90%, 60%, 0.3)';
  return (
    <motion.div layout initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springPresets.softCard, delay: index * 0.05 }} whileHover={{ y: -8, boxShadow: hoverShadow, transition: { duration: 0.2 } }} style={{ gridColumn, gridRow, boxShadow: baseShadow }} className="group relative bg-white/80 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 rounded-3xl p-6 cursor-pointer overflow-hidden" onClick={() => router.push(`/books/${book.subject_slug}`)}>
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">
        <motion.div whileHover={{ rotate: -5, scale: 1.1 }} transition={springPresets.snappyButton} className="w-16 h-16 mb-5 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
        </motion.div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{book.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{book.subject} • {book.program_name} • {book.board}</p>
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-3 py-1 text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">{book.edition_year} Edition</span>
          {book.metadata?.grade_level && <span className="px-3 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">Grade {book.metadata.grade_level}</span>}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-200/60 dark:border-gray-700/60">
          <div className="flex items-center gap-4">
            <div className="text-center"><p className="text-lg font-bold text-gray-900 dark:text-white">{book.total_chapters}</p><p className="text-xs text-gray-500 dark:text-gray-400">Chapters</p></div>
            <div className="text-center"><p className="text-lg font-bold text-gray-900 dark:text-white">{book.total_topics}</p><p className="text-xs text-gray-500 dark:text-gray-400">Topics</p></div>
          </div>
          {book.is_live ? <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Live</span> : <span className="text-xs font-medium text-gray-400">Draft</span>}
        </div>
      </div>
      <div className="absolute inset-0 rounded-3xl border-2 border-violet-500/0 group-hover:border-violet-500/30 transition-colors duration-300 pointer-events-none" />
    </motion.div>
  );
}

function BottomNav({ activeTab }: { activeTab: string }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', href: '/dashboard' },
    { id: 'books', label: 'Books', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', href: '/books' },
    { id: 'vault', label: 'Vault', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4', href: '/my-vault' },
    { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', href: '/profile' },
  ];
  return (
    <LayoutGroup>
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={springPresets.toastEntry} className="relative flex items-center gap-2 px-3 py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-[0_8px_30px_hsla(0,0%,0%,0.12)]">
          {navItems.map((item) => (
            <Link key={item.id} href={item.href} className="relative px-4 py-3 rounded-2xl transition-colors">
              {activeTab === item.id && <motion.div layoutId="active-pill" transition={springPresets.activePill} className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl" />}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={activeTab === item.id ? 'white' : 'currentColor'} strokeWidth="2" className={activeTab === item.id ? '' : 'text-gray-600 dark:text-gray-400'}><path d={item.icon} strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className={`text-xs font-medium ${activeTab === item.id ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{item.label}</span>
              </div>
            </Link>
          ))}
        </motion.div>
      </nav>
    </LayoutGroup>
  );
}

function LeftSidebar({ activeTab }: { activeTab: string }) {
  const navItems = [
    { id: 'home', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', href: '/dashboard' },
    { id: 'books', label: 'Books', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', href: '/books' },
    { id: 'vault', label: 'My Vault', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4', href: '/my-vault' },
    { id: 'progress', label: 'Progress', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', href: '/progress' },
  ];
  return (
    <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 h-full bg-white/5 dark:bg-black/10 backdrop-blur-md border-r border-gray-200/60 dark:border-gray-700/60 p-6 z-40">
      <Link href="/dashboard" className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        </div>
        <span className="text-xl font-bold text-gray-900 dark:text-white">StudyVault</span>
      </Link>
      <LayoutGroup>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link key={item.id} href={item.href} className="relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors group">
              {activeTab === item.id && <motion.div layoutId="active-pill-desktop" transition={springPresets.activePill} className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl" />}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeTab === item.id ? 'white' : 'currentColor'} strokeWidth="2" className={`relative z-10 ${activeTab === item.id ? '' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}><path d={item.icon} strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span className={`relative z-10 font-medium ${activeTab === item.id ? 'text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}>{item.label}</span>
            </Link>
          ))}
        </nav>
      </LayoutGroup>
      <div className="pt-6 border-t border-gray-200/60 dark:border-gray-700/60">
        <Link href="/profile" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold">U</div>
          <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-white truncate">User</p><p className="text-xs text-gray-500 dark:text-gray-400 truncate">Free Plan</p></div>
        </Link>
      </div>
    </aside>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('home');
  const { data, error, isLoading, mutate } = useSWR<DashboardData>('/api/dashboard', async (url) => { const res = await fetch(url, { credentials: 'include', cache: 'no-store' }); if (!res.ok) throw new Error('Failed to fetch dashboard'); return res.json(); });
  const handleRetry = useCallback(() => { mutate(); }, [mutate]);

  if (isLoading) return (<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"><LeftSidebar activeTab={activeTab} /><main className="lg:ml-64 p-6 lg:p-10 pb-32 lg:pb-10"><DashboardSkeleton /></main><BottomNav activeTab={activeTab} /></div>);
  if (error) return (<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"><LeftSidebar activeTab={activeTab} /><main className="lg:ml-64 p-6 lg:p-10 pb-32 lg:pb-10"><ErrorState error={error.message} onRetry={handleRetry} /></main><BottomNav activeTab={activeTab} /></div>);
  if (!data?.books || data.books.length === 0) return (<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"><LeftSidebar activeTab={activeTab} /><main className="lg:ml-64 p-6 lg:p-10 pb-32 lg:pb-10"><EmptyState /></main><BottomNav activeTab={activeTab} /></div>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <LeftSidebar activeTab={activeTab} />
      <main className="lg:ml-64 p-6 lg:p-10 pb-32 lg:pb-10">
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={springPresets.toastEntry} className="mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">Welcome back!</h1>
          <p className="text-gray-600 dark:text-gray-400">Continue your learning journey where you left off.</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...springPresets.snappyButton, delay: 0.1 }} className="px-6 py-3 bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-[0_4px_30px_hsla(270,90%,60%,0.1)]"><p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{data.totalXP}</p><p className="text-xs text-gray-500 dark:text-gray-400">Total XP</p></motion.div>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...springPresets.snappyButton, delay: 0.15 }} className="px-6 py-3 bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-[0_4px_30px_hsla(270,90%,60%,0.1)]"><p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.masteredCount}</p><p className="text-xs text-gray-500 dark:text-gray-400">Topics Mastered</p></motion.div>
          </div>
        </motion.header>
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your Books</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
            {data.books.map((book, index) => (<BookCard key={book._id} book={book} index={index} />))}
          </div>
        </section>
      </main>
      <BottomNav activeTab={activeTab} />
    </div>
  );
}
