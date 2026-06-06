// apps/student/app/(public)/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Flame } from 'lucide-react';
import { FadeIn, ExamReadinessCard, StatsBar, FeatureGrid, HowItWorks } from './HeroAnimated';

export const metadata: Metadata = {
  title: "Pakistan's Smartest Study Platform | Ace Your Boards",
  description:
    'AI explanations, past paper frequency tracking, and real progress monitoring for Punjab, FBISE, Karachi, and Sindh boards. Grade 9 and 10.',
};

// ── Main Page ─────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-20">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* LEFT COLUMN */}
          <FadeIn>
            <div className="flex-1 text-center lg:text-left">
              {/* Badge Pill */}
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
                🇵🇰 Built for Pakistani Board Exams
              </div>

              {/* H1 Headline */}
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-6">
                Pakistan&apos;s Smartest<br />
                <span className="text-emerald-600">Study Platform</span>
              </h1>

              {/* Body Copy */}
              <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-xl">
                AI explanations, past paper frequency tracking, and real progress
                monitoring. Punjab, FBISE, Karachi, and Sindh boards. Grade 9 and 10.
              </p>

              {/* CTA Row */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium text-base hover:bg-emerald-700 transition-colors min-h-[44px]"
                >
                  Start Studying Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-700 px-6 py-3 rounded-lg font-medium text-base hover:bg-slate-50 transition-colors min-h-[44px]"
                >
                  Browse Books
                </Link>
              </div>

              {/* Social Proof */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  500+ topics
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-emerald-600" />
                  4 boards
                </span>
                <span>✓ Free to start</span>
              </div>
            </div>
          </FadeIn>

          {/* RIGHT COLUMN - Exam Readiness Card */}
          <div className="flex-shrink-0">
            <ExamReadinessCard />
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <StatsBar />

      {/* FEATURE GRID */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 mb-3">
              Everything You Need to Ace Your Boards
            </h2>
            <p className="text-slate-500">Built specifically for Pakistani board exam students</p>
          </div>
        </FadeIn>
        <FeatureGrid />
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-2xl mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 mb-3">
                How It Works
              </h2>
            </div>
          </FadeIn>
          <HowItWorks />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <FadeIn>
          <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              Ready to Ace Your Boards?
            </h2>
            <p className="text-slate-300 mb-8 max-w-md mx-auto">
              Join students studying smarter — it&apos;s free to start.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-emerald-400 transition-colors min-h-[44px]"
            >
              Open Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-xs text-slate-400 mt-4">
              No credit card needed. Free plan includes all core content.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400">
            © 2026 StudyVault PK — Built for Pakistani Students 🇵🇰
          </p>
          <div className="flex gap-4 text-sm text-slate-500">
            <Link href="/about" className="hover:text-slate-700 transition-colors">About</Link>
            <span className="text-slate-300">·</span>
            <Link href="/privacy" className="hover:text-slate-700 transition-colors">Privacy</Link>
            <span className="text-slate-300">·</span>
            <Link href="/contact" className="hover:text-slate-700 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
