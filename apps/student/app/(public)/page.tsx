// apps/student/app/(public)/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Pakistan's #1 Board Exam Prep Platform | StudyVault PK",
  description:
    'Grade 9-10 board exam prep with AI explanations, past paper analysis, and progress tracking. Trusted by students across Punjab, Federal, and Sindh boards.',
};

// ── Progress Wheel (pure SVG, no deps) ──────────────────────────
function HeroProgressWheel() {
  const percent = 87;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const filled = (percent / 100) * circ;

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#E2E8F0" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          stroke="#10B981"
          strokeWidth="12"
          strokeDasharray={`${filled} ${circ}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#0A2540">
          {percent}%
        </text>
        <text x="70" y="85" textAnchor="middle" fontSize="10" fill="#64748B">
          Exam Ready
        </text>
      </svg>
      <span className="mt-2 text-xs font-medium text-accent-600 bg-accent-100 px-3 py-1 rounded-full">
        ⭐ Topic Mastered
      </span>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────
function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl">{icon}</span>
      <span className="text-xl font-bold text-primary-900" style={{ fontFamily: 'var(--font-playfair)' }}>
        {value}
      </span>
      <span className="text-xs text-gray-500 text-center">{label}</span>
    </div>
  );
}

// ── Feature Card ─────────────────────────────────────────────────
function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <span className="text-3xl block mb-3">{icon}</span>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

// ── Step Card ─────────────────────────────────────────────────────
function StepCard({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center text-sm">
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-20 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            🇵🇰 Built for Pakistani Students
          </div>
          <h1
            className="text-4xl lg:text-5xl font-bold text-primary-900 leading-tight mb-6"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Pakistan&apos;s Smartest
            <span className="block text-primary-600">Study Platform</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-xl">
            Grade 9–10 board exam prep with AI explanations, past paper frequency analysis,
            and real progress tracking. Punjab, Federal, and Sindh boards supported.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-7 py-3.5 rounded-xl font-medium text-base hover:bg-primary-700 transition-colors shadow-sm"
            >
              Start Studying Free →
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-7 py-3.5 rounded-xl font-medium text-base hover:bg-gray-50 transition-colors"
            >
              Browse Topics
            </Link>
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col items-center gap-6">
          <HeroProgressWheel />
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm w-64">
            <p className="text-xs text-gray-500 mb-1">🔥 Hot Topic — Lahore Board</p>
            <p className="font-semibold text-gray-900 text-sm">Vernier Callipers</p>
            <p className="text-xs text-gray-400 mt-0.5">Appeared 4 times in past 5 years</p>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-primary-50 border-y border-primary-100 py-8">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard icon="📚" value="500+" label="Topics Live" />
          <StatCard icon="🎯" value="5" label="Boards Supported" />
          <StatCard icon="🤖" value="AI" label="Powered Explanations" />
          <StatCard icon="🔥" value="Past" label="Papers Included" />
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2
            className="text-3xl font-bold text-primary-900 mb-3"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Everything You Need to Ace Your Boards
          </h2>
          <p className="text-gray-500">Built specifically for Pakistani board exam students</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon="🔥"
            title="Exam Frequency"
            desc="See exactly which topics appear most in Lahore, FBISE, and other past papers."
          />
          <FeatureCard
            icon="🤖"
            title="AI Explain"
            desc="Get instant simple explanations of any topic. In English, in plain words."
          />
          <FeatureCard
            icon="📊"
            title="Progress Wheel"
            desc="Track exactly how exam-ready you are. Score 80%+ on a quiz to Master a topic."
          />
          <FeatureCard
            icon="📦"
            title="My Study Vault"
            desc="Save YouTube links, flashcards, and highlights for quick revision before exams."
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold text-primary-900 mb-3"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              How It Works
            </h2>
          </div>
          <div className="space-y-8">
            <StepCard
              number="1"
              title="Choose Your Subject"
              desc="Select your board, grade, and subject. We support Punjab, FBISE, Karachi, and more."
            />
            <StepCard
              number="2"
              title="Read & Practice"
              desc="Study topics with interactive content — formulas, diagrams, MCQs all in one place."
            />
            <StepCard
              number="3"
              title="Track Your Mastery"
              desc="Score 80%+ on a topic quiz to mark it Mastered. Your progress wheel shows exam readiness."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2
          className="text-3xl font-bold text-primary-900 mb-4"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Ready to Ace Your Boards?
        </h2>
        <p className="text-gray-500 mb-8">Join thousands of Pakistani students studying smarter.</p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-primary-700 transition-colors shadow-md"
        >
          Create Free Account — It's Free →
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© 2026 StudyVault PK — Built for Pakistani Students 🇵🇰</p>
      </footer>
    </main>
  );
}
