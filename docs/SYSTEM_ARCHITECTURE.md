# Study Vault Onyx - System Architecture Map
**Generated:** 2025-06-01  
**Status:** Production Audit Phase  
**Target Stack:** Next.js 16.x, TypeScript, MongoDB, Tailwind CSS

---

## 1. Executive Summary

This document serves as the single source of truth for the `study_vault_onyx` monorepo architecture. It maps the ecosystem from the user journey (Onboarding → Learning → Mastery) to the underlying codebase structure, identifying critical bottlenecks and migration paths for Next.js 16.x.

### Repository Statistics
| Metric | Count | Status |
| :--- | :--- | :--- |
| **Total TS/JS Files** | 205 | ✅ Indexed |
| **API Endpoints** | 52 | ⚠️ 12 Need Async Update |
| **React Components** | 64 | ⚠️ 8 Duplicated |
| **Database Models** | 12 | ✅ Stable |
| **Shared Utilities** | 15 | ✅ Stable |

---

## 2. Feature Mapping Matrix

| Feature Name | Status | Complexity | Directory Location | Key API Routes | Key UI Components | DB Models |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication** | 🔴 Needs Work | High | `apps/*/lib/auth.ts` | `/api/auth/[...nextauth]` | `LoginForm`, `AuthWrapper` | `User`, `Session` |
| **Admin Dashboard** | 🟢 Stable | Medium | `apps/admin/app/(dashboard)` | `/api/admin/stats` | `AdminLayout`, `StatsCard` | `Analytics` |
| **Content Ingestion** | 🟢 Stable | High | `apps/admin/app/ingest` | `/api/admin/ingest` | `IngestForm`, `FileUploader` | `Content`, `Source` |
| **Student Learning Path** | 🟢 Stable | High | `apps/student/app/learn` | `/api/student/path` | `PathVisualizer`, `ModuleCard` | `LearningPath`, `Module` |
| **Quiz Engine** | 🟢 Stable | Medium | `apps/student/app/quiz` | `/api/quiz/generate` | `QuizInterface`, `QuestionCard` | `Quiz`, `Question` |
| **AI Explanation** | 🟡 Needs Work | High | `apps/student/app/explain` | `/api/ai/explain` | `ExplanationView` | `AILog` |
| **Knowledge Vault** | 🟢 Stable | Medium | `apps/student/app/vault` | `/api/vault/search` | `VaultGrid`, `NoteEditor` | `VaultItem`, `Note` |
| **Progress Tracking** | 🟢 Stable | Medium | `apps/student/app/profile` | `/api/student/progress` | `ProgressChart`, `BadgeList` | `Progress`, `Achievement` |
| **Billing & Subs** | 🔴 Needs Work | High | `apps/student/app/billing` | `/api/billing/webhook` | `PricingTable` (Missing) | `Subscription`, `Invoice` |
| **Search & Discovery** | 🟢 Stable | Medium | `apps/*/components/search` | `/api/search` | `SearchBar`, `ResultList` | `Content`, `Tag` |
| **Quran Integration** | 🟢 Stable | Low | `apps/student/app/quran` | `/api/quran/verse` | `QuranReader`, `TafseerPanel` | `Verse`, `Tafseer` |
| **SEO & Public Pages** | 🟢 Stable | Medium | `apps/student/app/(public)` | `/api/og` | `LandingPage`, `BlogPost` | `Post`, `SeoMeta` |
| **Onboarding Flow** | 🟢 Stable | Low | `apps/student/app/onboard` | `/api/student/onboard` | `OnboardingWizard` | `UserProfile` |

---

## 3. Critical Architectural Debt (Top 5)

### 1. 🔴 Fragmented Authentication System (CRITICAL)
- **Issue:** Dual auth mechanisms detected. `apps/admin` uses a custom session cookie while `apps/student` relies on NextAuth v4. This creates a security gap where session invalidation in one app does not propagate to the other.
- **Impact:** Users can remain logged in on one portal after being banned/logging out on the other.
- **Fix Strategy:** Consolidate to a single shared `AuthContext` in `packages/auth` using HTTP-only cookies with a unified JWT strategy.

### 2. 🟠 Missing Production UIs for Billing (HIGH)
- **Issue:** The billing logic exists in the API layer, but the frontend `PricingTable` and `SubscriptionManager` components are stubs or missing entirely.
- **Impact:** Cannot launch paid tiers; manual intervention required for upgrades.
- **Fix Strategy:** Implement `packages/ui/billing` with Stripe Elements integration and webhook handling UI.

### 3. 🟠 Duplicate Component Logic (HIGH)
- **Issue:** `Button`, `Card`, and `Modal` components exist in both `apps/admin/components` and `apps/student/components` with slight style variations.
- **Impact:** Double maintenance burden; inconsistent design language.
- **Fix Strategy:** Enforce strict import from `@study-vault/ui` for all atomic components. Delete local duplicates.

### 4. 🟡 Incomplete Error Boundaries (MEDIUM)
- **Issue:** `apps/student` has global error boundaries, but `apps/admin` lacks granular error handling for data-fetching zones (e.g., ingestion failures).
- **Impact:** Admin dashboard crashes silently on API timeouts, leading to data confusion.
- **Fix Strategy:** Implement `ErrorState` and `RetryBoundary` components in `packages/ui` and wrap all Server Component Suspense boundaries.

### 5. 🟡 AI Rate Limiting Gaps (MEDIUM)
- **Issue:** No circuit breaker pattern implemented for AI endpoints. A spike in student usage could exhaust API keys or hit provider limits instantly.
- **Impact:** Service outage during peak study hours.
- **Fix Strategy:** Implement token bucket algorithm in `packages/lib/rate-limit` using Redis (Upstash) for edge compatibility.

---

## 4. Next.js 16.x Migration Plan

The following files will **BREAK** immediately upon upgrading to Next.js 16.x due to the `params` and `searchParams` becoming Promises.

### 🚨 Files Requiring Immediate Refactor (Async Params)

| File Path | Current Pattern | Required Fix |
| :--- | :--- | :--- |
| `apps/student/app/quiz/[id]/page.tsx` | `export default function Page({ params })` | `await params` before access |
| `apps/student/app/vault/[itemId]/page.tsx` | `const { itemId } = params` | `const { itemId } = await params` |
| `apps/admin/app/ingest/[jobId]/page.tsx` | `useSearchParams()` hook | `await searchParams` in Server Comp |
| `apps/student/app/learn/[pathId]/module/[modId]/page.tsx` | Nested param destructuring | Deep await for nested params |
| `apps/student/app/api/trpc/[trpc]/route.ts` | Dynamic route segment | Verify async compatibility |

### 🛠 Cache Directive Updates
Next.js 16 replaces `export const dynamic = 'force-dynamic'` with standard HTTP cache headers and the `use cache` directive.

- **Action:** Scan all `layout.tsx` and `page.tsx` files.
- **Replace:** `export const revalidate = 3600` → `use cache: private, max-age=3600` (where applicable).
- **Verify:** All API routes explicitly set `Cache-Control` headers.

---

## 5. Product Engineering Journey Map

### Phase 1: Onboarding (Low Friction)
- **Entry:** `apps/student/app/(public)/page.tsx`
- **Flow:** Landing → Sign Up → **Onboarding Wizard** (`/onboard`) → Initial Path Selection.
- **Gap:** Onboarding wizard lacks "Skip" functionality for non-essential fields.

### Phase 2: Core Learning Loop
- **Entry:** `apps/student/app/learn/page.tsx`
- **Flow:** Dashboard → **Module Player** → **Quiz Engine** → **AI Explanation**.
- **Gap:** AI Explanation latency needs optimistic UI updates.

### Phase 3: Mastery & Retention
- **Entry:** `apps/student/app/vault/page.tsx`
- **Flow:** Review Flashcards → **Knowledge Vault** → Share Notes.
- **Gap:** Social sharing features are unimplemented.

### Phase 4: Admin & Growth
- **Entry:** `apps/admin/app/(dashboard)/page.tsx`
- **Flow:** Analytics → **Content Ingestion** → User Management → **Billing Oversight**.
- **Gap:** Billing oversight UI is missing (see Debt #2).

---

## 6. Shared Library Architecture (`packages/`)

| Package | Purpose | Dependencies | Status |
| :--- | :--- | :--- | :--- |
| `@study-vault/db` | Mongoose schemas & connection | `mongoose`, `zod` | ✅ Stable |
| `@study-vault/ui` | Shared React components | `tailwind-merge`, `clsx`, `framer-motion` | ⚠️ Needs Deduplication |
| `@study-vault/auth` | Auth utilities & middleware | `next-auth`, `jose` | 🔴 Needs Consolidation |
| `@study-vault/lib` | Generic utilities (cn, formatters) | `date-fns`, `zod` | ✅ Stable |
| `@study-vault/config` | ESLint, TSConfig, Tailwind Config | `typescript`, `eslint` | ✅ Stable |

---

## 7. Actionable Roadmap

### Sprint 1: Stability & Security (Week 1)
- [ ] Consolidate Auth into `packages/auth`.
- [ ] Implement Global Error Boundaries in Admin.
- [ ] Add Rate Limiting to all `/api/ai/*` routes.

### Sprint 2: Monetization Readiness (Week 2)
- [ ] Build `PricingTable` and `SubscriptionManager` components.
- [ ] Connect Stripe Webhooks to `packages/db` models.
- [ ] Test upgrade/downgrade flows end-to-end.

### Sprint 3: Next.js 16 Migration (Week 3)
- [ ] Refactor 12 identified route files for `await params`.
- [ ] Replace legacy cache exports with `use cache` directives.
- [ ] Run full E2E test suite against Canary build.

### Sprint 4: Component Library Cleanup (Week 4)
- [ ] Audit `apps/*/components` for duplicates.
- [ ] Migrate all atomic components to `packages/ui`.
- [ ] Enforce barrel exports (`index.ts`) for strict imports.

---

*End of System Architecture Map*
