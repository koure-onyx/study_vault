# Study Vault Onyx — System Architecture Map

**Generated:** 2025-06-05  
**Version:** 1.0.0  
**Stack:** Next.js 14 App Router, TypeScript, MongoDB/Mongoose, Tailwind CSS

---

## Executive Summary

Study Vault Onyx is a comprehensive educational platform with dual applications:
- **apps/student**: Student-facing learning portal with content consumption, quizzes, AI assistance, and progress tracking
- **apps/admin**: Admin dashboard for content ingestion, user management, and system configuration

The monorepo follows a shared-package architecture with centralized database models, authentication utilities, and AI providers.

---

## Repository Structure

```
study_vault_onyx/
├── apps/
│   ├── admin/                    # Admin Dashboard Application
│   │   ├── app/(dashboard)/      # Protected admin routes
│   │   ├── app/api/admin/        # Admin-specific API endpoints
│   │   ├── app/api/auth/         # Authentication routes
│   │   ├── app/api/books/        # Book management APIs
│   │   ├── components/ui/        # Shared UI components
│   │   └── lib/                  # Admin utilities
│   │
│   └── student/                  # Student Learning Application
│       ├── app/(auth)/           # Auth pages (login, signup, onboarding)
│       ├── app/(dashboard)/      # Protected student routes
│       ├── app/(public)/         # Public-facing pages
│       ├── app/api/              # Student API endpoints
│       ├── components/           # React components (domain, layout, ui)
│       ├── hooks/                # Custom React hooks
│       └── lib/                  # Student utilities
│
├── packages/
│   ├── db/                       # Database Layer
│   │   ├── models/               # Mongoose schemas (12 models)
│   │   └── connect.js            # DB connection utility
│   │
│   └── lib/                      # Shared Business Logic
│       ├── ai/                   # AI provider & prompts
│       ├── auth/                 # JWT, middleware, NextAuth options
│       ├── content/              # SEO, book filtering
│       ├── ingestion/            # Content ingestion pipeline
│       ├── seo/                  # JSON-LD, metadata
│       └── utils/                # Hash, progress, slug utilities
│
└── scripts/                      # One-off automation scripts
```

---

## Feature Mapping Matrix

| Feature | Status | Complexity | Directory Location | Key API Routes | Key Components | Database Models |
|---------|--------|------------|-------------------|----------------|----------------|-----------------|
| Authentication | Needs Work | High | apps/student/app/(auth), packages/lib/auth | /api/auth/login, /api/auth/signup, /api/auth/google, /api/auth/forgot-password, /api/auth/verify-otp | LoginForm, SignupForm, OnboardingModal | User |
| Admin Dashboard | Stable | Medium | apps/admin/app/(dashboard) | /api/admin/courses, /api/admin/users, /api/admin/metrics, /api/admin/config/ai-provider | Admin pages (books, content, control) | User, Book, Chapter, Topic |
| Content Ingestion | Stable | High | packages/lib/ingestion, apps/admin/app/api/books | /api/books/ingest, /api/books, /api/chapters | Book ingest pages | Book, Chapter, Topic, Program, Board |
| Student Learning Path | Stable | High | apps/student/app/(dashboard)/[boardSlug]/[programSlug]/[subjectSlug] | /api/topics/by-slug/*, /api/chapters/[id]/topics | BookChapterIndex, ChapterReader, TopicLevelReader, TopicArticle | Topic, Chapter, Book, Program, Board |
| Quiz Engine | Stable | Medium | apps/student/app/(dashboard)/quiz, apps/student/components | /api/quiz, /api/progress/quiz-score | QuizEngine, QuestionRenderer | Question, Topic, UserProgress |
| AI Explanation | Needs Work | High | apps/student/app/api/ai, packages/lib/ai | /api/ai/explain, /api/ai/flashcards, /api/ai/generate-questions | AiCognitivePanel, ExplainPanel, FlashcardCreator, StreamingText | Topic, User, UserVault |
| Knowledge Vault | Stable | Medium | apps/student/app/(dashboard)/my-vault, apps/student/components/domain/vault | /api/vault, /api/vault/[itemId] | VaultItemCard, FlashcardComponent, NoteCard | UserVault, Topic |
| Progress Tracking | Stable | Medium | apps/student/app/api/progress, packages/lib/utils/progress.js | /api/progress/mark-read, /api/progress/chapter/[id], /api/progress/program/[id] | ProgressWheel, XPTracker, MasteryBadge | UserProgress, User |
| Billing & Subscriptions | Needs Work | High | apps/student/app/(dashboard)/billing, apps/student/app/api/checkout | /api/checkout, /api/webhooks/payments | Billing page, Premium page | Subscription, User |
| Search & Discovery | Stable | Medium | apps/student/app/(public)/search, apps/student/app/api/search | /api/search, /api/search-redirect | SearchInput, SearchBar | Topic, Book, Chapter |
| Quran Integration | Stable | Low | apps/student/components/domain/quran | /api/topics/[id]/quran-words | QuranVerseRenderer, SurahNavigator, WordByWordGrid | QuranVerse, QuranWord, Topic |
| SEO & Public Pages | Stable | Medium | apps/student/app/(public), packages/lib/seo | /api/og, /api/topics/public/* | JsonLd, OG image route | Topic, Book, SEO fields |
| Onboarding Flow | Stable | Low | apps/student/app/(auth)/onboarding | /api/onboarding, /api/user/onboarding | OnboardingForm, OnboardingModal | User |

---

## Database Schema Overview

### Core Models (packages/db/models/)

| Model | Purpose | Key Fields | Relations |
|-------|---------|------------|-----------|
| User | User accounts (students, parents, admins) | email, password_hash, role, student_profile, google_id, subscription | Program[], Board, linked_children[] |
| Program | Educational programs (grade levels) | name, slug, program_type | User.student_profile.program_ids |
| Board | Education boards (FBISE, Punjab, etc.) | name, slug, short_code | User.student_profile.board_id, Book.board_id |
| Book | Textbook metadata & content | title, subject, edition_year, is_current_edition, ingestion_status | Chapter[], Program, Board |
| Chapter | Book chapters | title, chapter_number, slug, display_order | Book, Topic[] |
| Topic | Individual learning topics | title, slug, raw_text, is_live, workflow_status, ai_cache | Chapter, Book, Program, Board |
| Question | Quiz questions (MCQs) | question, options[], correct_answer, explanation, type | Topic |
| UserProgress | Learning progress tracking | user_id, topic_id, chapter_id, is_read, scroll_depth, quiz_scores[] | User, Topic, Chapter |
| UserVault | Saved items (notes, flashcards, bookmarks) | user_id, topic_id, type, flashcard, note, highlight | User, Topic |
| Subscription | Payment & subscription records | user_id, plan, status, transaction_id, expires_at | User |
| QuranVerse | Quran verse mappings | verse_key, text_uthmani, translations[] | Topic (via topic.quran_verses) |
| QuranWord | Word-by-word Quran data | word_number, text, translation, transliteration | QuranVerse |

---

## Critical Architectural Debt (Top 5)

### 1. Fragmented Authentication System
**Location:** packages/lib/auth/, apps/*/app/api/auth/

**Issues:**
- Dual auth mechanisms: NextAuth sessions + custom JWT (sv_token cookie)
- Inconsistent token validation across routes
- Missing refresh token rotation
- No centralized session invalidation on password change

**Fix Priority:** CRITICAL

### 2. Missing Production UIs for Key Features
**Location:** apps/student/app/(dashboard)/billing, apps/admin/app/(dashboard)/control

**Issues:**
- Billing page lacks payment method selection UI
- No subscription management interface
- Admin AI provider config page incomplete
- Missing empty states for vault, progress pages

**Fix Priority:** HIGH

### 3. Duplicate Component Logic
**Location:** apps/student/components/, apps/admin/components/

**Issues:**
- Alert, Button, Card, Input, SearchBar duplicated in both apps
- QuizEngine exists in two locations
- ProgressWheel component duplicated
- No shared component library

**Fix Priority:** HIGH

### 4. Incomplete Error Boundaries & Loading States
**Location:** Throughout apps/student/app/, apps/admin/app/

**Issues:**
- Only error.tsx and global-error.tsx in student app; admin has none
- No custom skeleton loaders
- Missing retry logic for failed API calls

**Fix Priority:** MEDIUM

### 5. AI Rate Limiting & Caching Gaps
**Location:** apps/student/app/api/ai/, packages/lib/ai/

**Issues:**
- Rate limiting per-user but no global rate limit
- AI cache exists but invalidation strategy unclear
- No circuit breaker for AI provider failures

**Fix Priority:** MEDIUM

---

## Next.js 16.x Migration Checklist

Files requiring async params verification:
- apps/admin/app/api/admin/courses/[courseId]/route.ts
- apps/admin/app/api/admin/users/[userId]/route.ts
- apps/admin/app/api/books/[bookId]/preview-url/route.ts
- apps/admin/app/api/chapters/[chapterId]/route.ts
- apps/admin/app/api/topics/[topicId]/preview-url/route.ts
- apps/student/app/api/chapters/[chapterId]/topics/route.ts
- apps/student/app/api/topics/[topicId]/adjacent/route.ts
- apps/student/app/api/topics/[topicId]/quran-words/route.ts
- apps/student/app/api/topics/[topicId]/route.ts
- apps/student/app/api/progress/chapter/[chapterId]/route.ts
- apps/student/app/api/progress/program/[programId]/route.ts
- apps/student/app/api/vault/[itemId]/route.ts

Already compliant (using await params):
- apps/student/app/api/topics/by-slug/[subjectSlug]/[chapterNumber]/[topicSlug]/route.ts
- apps/student/app/(dashboard)/[boardSlug]/[programSlug]/[subjectSlug]/[[...slug]]/page.tsx
- apps/student/app/(dashboard)/quiz/[topicId]/page.tsx

---

## Orphaned Code & Missing Links

### Potentially Orphaned Files
- query.js (root) - Unclear purpose
- scripts/assembleQuranBook.js - One-off script
- scripts/ingestDeepSeekJSON.js - Duplicate of API flow?
- scripts/quranDownloaderSeed.js - One-off script

### Missing Links
- Admin book editing UI - Missing
- User profile settings - Missing
- Parent dashboard - Missing (role exists in User model)
- Teacher features - Missing (role exists but no UI)
- Email verification flow - Partial (OTP exists, email link missing)

---

## Recommendations for Scaling

### Immediate Actions (Week 1-2)
1. Consolidate Auth to single strategy
2. Create shared UI package (packages/ui)
3. Add missing empty states
4. Document scripts folder

### Short-Term (Month 1)
1. Implement circuit breaker for AI
2. Add global error boundary
3. Build subscription management UI
4. Create admin book editor

### Long-Term (Quarter 1)
1. Migrate to Next.js 16 fully
2. Implement real-time collaboration
3. Build analytics dashboard
4. Add mobile app (React Native)

---

**End of System Architecture Document**
