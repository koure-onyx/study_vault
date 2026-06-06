# Study Vault Onyx - UX Specification & Master User Flow

**Version:** 1.0.0  
**Last Updated:** June 2025  
**Status:** Production Ready  

---

## 1. THE ONBOARDING FLOW

### Path: Landing Page → Google Auth → Role Selection → Dashboard

| Step | Screen | Action | Expected Outcome | Accessibility Check |
|------|--------|--------|------------------|---------------------|
| 1 | `/` (Landing) | User clicks "Get Started" or "Login" | Redirects to `/api/auth/signin` | Touch target ≥48px, high contrast |
| 2 | `/api/auth/signin` | User selects "Sign in with Google" | Opens Google OAuth popup | Keyboard navigable, ARIA labels |
| 3 | Google OAuth | User grants permissions | Redirects back to `/onboarding` (new) or `/dashboard` (returning) | Secure redirect validation |
| 4 | `/onboarding` (New Users) | User selects role: Student/Parent/Teacher | Saves role to DB, redirects to role-specific dashboard | Clear visual distinction between cards |
| 5 | `/dashboard` | User sees personalized welcome | LoadingProvider displays WaveformLoader until data ready | Skeleton screens match content layout |

### Ghost Login Prevention
- **Middleware Guard:** `apps/student/middleware.ts` checks `session.user` before allowing `/dashboard` access
- **Loading State:** `status === 'loading'` returns `null` or minimal skeleton (no navbar flash)
- **Auth State Sync:** `useSession()` hook used consistently in TopNav and BottomNavigation

---

## 2. THE LEARNING HIERARCHY

### Navigation Path: Dashboard → Board → Program → Subject → Chapter → Topic

```
/dashboard
  └── /board/[boardSlug]
        └── /program/[programSlug]
              └── /subject/[subjectSlug]
                    └── /chapter/[chapterId]
                          └── /topic/[topicId]
```

### Breadcrumb Behavior (`Breadcrumb.tsx`)

| Path Segment | Display Label | Clickable | Destination |
|--------------|---------------|-----------|-------------|
| `/board/punjab` | Punjab Board | ✅ | `/board/punjab` |
| `/program/fsc-part-1` | FSC Part 1 | ✅ | `/program/fsc-part-1` |
| `/subject/physics` | Physics | ✅ | `/subject/physics` |
| `/chapter/ch-001` | Ch 1: Measurements | ✅ | `/chapter/ch-001` |
| `/topic/t-001` | Basic Concepts | ❌ (Current) | N/A |

### Mobile Interaction: TopicCard Expansion

**Desktop (>768px):**
- Click expands card inline with smooth height animation
- Content reveals below card title

**Mobile (<768px):**
1. **Tap Detection:** `framer-motion` `whileTap={{ scale: 0.98 }}` provides haptic feedback
2. **Scroll Differentiation:** Gesture handler distinguishes tap (<150ms) vs scroll
3. **Bottom Sheet Trigger:** Tap opens `Sheet` component from `shadcn/ui`
4. **Sheet Content:** Full topic details, questions, AI explanation button
5. **Close Mechanism:** Swipe down or tap overlay closes sheet

**Spring Physics:**
```typescript
const springConfig = {
  type: "spring",
  stiffness: 300,
  damping: 25,
  mass: 0.8
}
```

### State Management During Navigation

| State | Component | Visual Feedback |
|-------|-----------|-----------------|
| Loading | `LoadingProvider` | WaveformLoader centered, navbar visible |
| Empty | `EmptyState` | Illustration + "No content yet" message |
| Error | `ErrorBoundary` | Retry button + support contact |
| Success | Content | Smooth fade-in with stagger children |

---

## 3. THE ADMIN COMMAND CENTER

### Path: Admin Login → Dashboard → Ingestion Form → Content Verification

| Step | Screen | Action | Expected Outcome | Security Check |
|------|--------|--------|------------------|----------------|
| 1 | `/admin` | Admin enters credentials (Google only) | Middleware verifies `role === 'admin'` | Reject non-admin with 403 |
| 2 | `/admin/dashboard` | Admin views system metrics | Real-time stats: users, books, ingestion queue | Data refresh every 30s |
| 3 | `/admin/books/ingest` | Admin fills form: Title, Board, Class, JSON payload | Validation on blur, character count | Sanitize JSON input |
| 4 | Submit | Admin clicks "Ingest Content" | LoadingProvider shows spinner, disables button | Prevent double-submit |
| 5 | Processing | API calls `IngestionEngine.processBookIngestion()` | Progress indicator if >2s | Timeout after 60s |
| 6 | Success | Toast notification + redirect to book list | Shows created chapters/topics count | Log audit trail |
| 7 | Error | Inline error message + retry option | Specific error: "Invalid JSON", "DB connection failed" | No stack trace exposure |

### Admin Navigation Structure
- **Main:** Dashboard, Analytics
- **Content:** Books, Chapters, Topics, Quiz Bank
- **Ingestion:** Bulk Import, JSON Processor
- **Users:** Students, Teachers, Parents
- **Settings:** System Config, Rate Limits

---

## 4. EDGE CASE MAP

### Mobile Back Button Behavior

| Current Screen | Back Action | Expected Result |
|----------------|-------------|-----------------|
| Bottom Sheet Open | Hardware/Swipe Back | Closes sheet, stays on page |
| Deep Nested Page (/topic) | Browser Back | Returns to parent (/chapter) with preserved scroll |
| Loading State | Browser Back | Cancels request, navigates back |
| Form Unsaved | Browser Back | Alert: "Discard changes?" |

### Ghost Login Prevention Flow

```
User attempts: GET /dashboard
  ↓
Middleware checks: session exists?
  ├─ NO → Redirect to /login?from=/dashboard
  └─ YES → Check status
       ├─ loading → Show skeleton (no redirect loop)
       ├─ authenticated → Allow access
       └─ unauthenticated → Redirect to /login
```

**Visual States:**
- **Logged Out:** Login button in TopNav, no user avatar
- **Loading:** Skeleton avatar pulse animation
- **Logged In:** User avatar with dropdown (Profile, Settings, Logout)

### Billing Page States

| State | Visual Elements | CTA | Secondary Actions |
|-------|-----------------|-----|-------------------|
| Empty (Free Tier) | Crown illustration, feature comparison table | "Upgrade to Premium" (primary) | "View Plans", "Contact Support" |
| Active Subscription | Current plan badge, next billing date, invoice table | "Manage Subscription" | "Download Invoice", "Change Plan" |
| Payment Failed | Warning icon, red banner, failed transaction details | "Retry Payment" | "Update Card", "Contact Support" |
| Cancelled | Greyed features, expiry date countdown | "Reactivate Now" | "Export Data", "Download History" |

---

## 5. UX EVALUATION METRICS SUMMARY

### Accessibility Audit
- ✅ All primary buttons ≥48x48px touch target
- ✅ Color contrast ratio ≥4.5:1 for text
- ✅ Keyboard navigation supported (Tab, Enter, Escape)
- ✅ Screen reader labels on all interactive elements
- ✅ Focus indicators visible on all inputs

### Navigation Depth Analysis
| Feature | Clicks from Dashboard | Status |
|---------|----------------------|--------|
| View Chapter | 2 (Board → Program → Subject → Chapter) | ⚠️ Consider quick search |
| Start Quiz | 3 (Chapter → Topic → Quiz Tab → Start) | ✅ Acceptable |
| Access Vault | 1 (Direct nav item) | ✅ Optimal |
| Contact Support | 2 (Settings → Support) | ✅ Optimal |
| Ingest Content (Admin) | 2 (Dashboard → Ingestion) | ✅ Optimal |

### Loading State Consistency
- ✅ **WaveformLoader:** Used for initial page loads (>500ms expected)
- ✅ **Skeleton Screens:** Match final content layout exactly
- ✅ **Button Loading:** Inline spinner, disabled state, text change ("Saving...")
- ✅ **Optimistic Updates:** UI updates immediately, reverts on error

---

## 6. IDENTIFIED UX FRICTION & RECOMMENDATIONS

### High Priority Fixes
1. **Onboarding Skip Option**
   - *Issue:* Returning users forced through full onboarding if interrupted
   - *Fix:* Add "Skip to Dashboard" link on step 2+

2. **Profile Quick Edit**
   - *Issue:* No direct link to edit profile from TopNav
   - *Fix:* Add "Edit Profile" option in avatar dropdown

3. **Breadcrumb Loading Skeleton**
   - *Issue:* Layout shift when breadcrumb loads
   - *Fix:* Reserve width based on path depth estimation

### Medium Priority Enhancements
4. **Search from Anywhere**
   - *Issue:* Search only accessible from dashboard
   - *Fix:* Add search icon in TopNav (opens modal)

5. **Offline Indicator**
   - *Issue:* No feedback when connection lost
   - *Fix:* Toast notification + retry queue for actions

6. **Progress Save Confirmation**
   - *Issue:* Users unsure if quiz progress auto-saves
   - *Fix:* Subtle "Saved" checkmark animation after completion

---

## 7. MOBILE RESPONSIVE CHECKLIST

| Component | Desktop Behavior | Mobile Behavior | Status |
|-----------|-----------------|-----------------|--------|
| AppShell | Sidebar navigation | Bottom navigation + hamburger menu | ✅ |
| TopicCard | Inline expansion | Bottom Sheet | ✅ |
| ChapterCard | Inline expansion | Bottom Sheet | ✅ |
| Quiz Interface | Full width | Stacked cards, larger tap targets | ✅ |
| Billing Table | Full columns | Horizontal scroll + sticky first column | ✅ |
| Admin Sidebar | Persistent left | Slide-out drawer | ✅ |
| Breadcrumb | Full path visible | Truncated with expand chevron | ⚠️ Needs implementation |

---

**Document Approval:**  
This UX specification serves as the binding contract for all future UI development. Any deviation requires CTO approval.

**Next Review Date:** After Sprint 6 (Parent/Teacher Features)
