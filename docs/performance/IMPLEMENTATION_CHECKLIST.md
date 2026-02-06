# Performance Optimization - Implementation Checklist

**Started:** 2026-01-23  
**Target Completion:** TBD  
**Total Tasks:** 28  
**Completed:** 0/28

---

## Phase 1: Quick Wins ⚡ (1-2 hours)

### Task 1.1: Bundle Optimization Config
**Priority:** CRITICAL  
**Estimated Time:** 5 minutes  
**Status:** ⬜ Not Started

**Action:**
```typescript
// next.config.js
const nextConfig = {
    experimental: {
        optimizePackageImports: ['lucide-react', 'recharts']
    }
};
```

**Files to Edit:**
- `next.config.js`

**Validation:**
- [ ] Run `npm run build`
- [ ] Check bundle size reduction in output
- [ ] Verify icons still display correctly

---

### Task 1.2: Prisma Index for Articles
**Priority:** CRITICAL  
**Estimated Time:** 10 minutes  
**Status:** ⬜ Not Started

**Action:**
```prisma
// prisma/schema.prisma
model Article {
    // ... existing fields
    
    @@index([status, createdAt])
    @@index([slug])
    @@index([authorId])
}
```

**Files to Edit:**
- `prisma/schema.prisma`

**Commands:**
```bash
npx prisma migrate dev --name add_article_indexes
npx prisma generate
```

**Validation:**
- [ ] Migration created successfully
- [ ] Run query with `EXPLAIN` to verify index usage
- [ ] Test Library page performance

---

### Task 1.3: Homepage Query Optimization
**Priority:** HIGH  
**Estimated Time:** 15 minutes  
**Status:** ⬜ Not Started

**Files to Edit:**
- `src/app/page.tsx` (Lines 37-75)

**Before:**
```typescript
cache.wrap("home:featured", () => prisma.article.findMany({
    where: { status: "PUBLISHED", isFeatured: true },
    include: {
        author: { select: { name: true, image: true } },
        category: { select: { name: true, slug: true } }
    },
    // Missing select for Article!
}))
```

**After:**
```typescript
cache.wrap("home:featured", () => prisma.article.findMany({
    where: { status: "PUBLISHED", isFeatured: true },
    select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        thumbnail: true,
        createdAt: true,
        author: { select: { name: true, image: true } },
        category: { select: { name: true, slug: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 3
}))
```

**Apply to:**
- [ ] `home:featured` query
- [ ] `home:latest` query
- [ ] `home:popular` query

**Validation:**
- [ ] Check network payload size (should reduce ~80%)
- [ ] Verify all data still displays
- [ ] Test responsiveness

---

### Task 1.4: Article Page - Parallel Queries
**Priority:** HIGH  
**Estimated Time:** 20 minutes  
**Status:** ⬜ Not Started

**Files to Edit:**
- `src/app/articles/[slug]/page.tsx` (Lines 20-65)

**Before:**
```typescript
const article = await getArticleBySlug(slug);
// ... validation ...
const articles = await prisma.article.findMany({ /* related */ });
```

**After:**
```typescript
// Start both immediately
const articlePromise = getArticleBySlug(slug);
const relatedPromise = prisma.article.findMany({
    where: { status: 'PUBLISHED', slug: { not: slug } },
    take: 3,
    orderBy: { views: 'desc' },
    select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        thumbnail: true,
        createdAt: true
    }
});

const [article, articles] = await Promise.all([
    articlePromise, 
    relatedPromise
]);

if (!article) notFound();
```

**Validation:**
- [ ] Measure latency improvement (should be ~200ms faster)
- [ ] Check related articles still display
- [ ] Test with slow 3G throttling

---

## Phase 2: Database Optimization 🗄️ (2-3 hours)

### Task 2.1: Admin Users Query Refactor
**Priority:** MEDIUM  
**Estimated Time:** 30 minutes  
**Status:** ⬜ Not Started

**Files to Edit:**
- `src/app/admin/users/page.tsx` (Lines 51-58)

**Before:**
```typescript
prisma.user.findMany({
    take: 5,
    orderBy: { progress: { _count: 'desc' } }, // N+1 query
    select: { /* ... */ }
})
```

**After:**
```typescript
// Fetch all users with progress count
const users = await prisma.user.findMany({
    select: {
        id: true,
        name: true,
        email: true,
        image: true,
        _count: {
            select: { progress: { where: { isCompleted: true } } }
        }
    }
});

// Sort in memory
const topUsers = users
    .sort((a, b) => b._count.progress - a._count.progress)
    .slice(0, 5);
```

**Validation:**
- [ ] Query time reduction
- [ ] Verify top users accuracy
- [ ] Test with large dataset

---

### Task 2.2: Library Page - Add Select Statements
**Priority:** MEDIUM  
**Estimated Time:** 20 minutes  
**Status:** ⬜ Not Started

**Files to Edit:**
- `src/app/library/page.tsx` (Line 37)

**Add select:**
```typescript
select: {
    id: true,
    title: true,
    slug: true,
    excerpt: true,
    thumbnail: true,
    createdAt: true,
    category: { select: { name: true } },
    author: { select: { name: true, image: true } }
}
```

**Validation:**
- [ ] Payload size reduction
- [ ] UI still renders correctly

---

### Task 2.3: Dashboard Learning - Optimize Nested Includes
**Priority:** LOW  
**Estimated Time:** 30 minutes  
**Status:** ⬜ Not Started

**Files to Edit:**
- `src/app/dashboard/learning/page.tsx` (Lines 18-29)

**Review:**
```typescript
const levels = await prisma.level.findMany({
    include: {
        modules: {
            include: {
                lessons: true // All fields!
            }
        }
    }
});
```

**Optimize:**
```typescript
const levels = await prisma.level.findMany({
    select: {
        id: true,
        title: true,
        order: true,
        modules: {
            select: {
                id: true,
                title: true,
                lessons: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        duration: true
                    }
                }
            }
        }
    },
    orderBy: { order: "asc" }
});
```

**Validation:**
- [ ] Check query performance
- [ ] Verify UI displays correctly

---

### Task 2.4: Add Indexes to Critical Models
**Priority:** HIGH  
**Estimated Time:** 30 minutes  
**Status:** ⬜ Not Started

**Files to Edit:**
- `prisma/schema.prisma`

**Add indexes:**
```prisma
model User {
    // ...
    @@index([email])
    @@index([createdAt])
}

model JournalEntry {
    // ...
    @@index([userId, status])
    @@index([entryDate])
}

model UserProgress {
    // ...
    @@index([userId, isCompleted])
    @@index([lessonId])
}

model Lesson {
    // ...
    @@index([moduleId, order])
    @@index([slug])
}
```

**Commands:**
```bash
npx prisma migrate dev --name add_performance_indexes
```

**Validation:**
- [ ] Run `EXPLAIN` on key queries
- [ ] Measure query time improvements

---

## Phase 3: Code Splitting 📦 (1-2 hours)

### Task 3.1: Dynamic Import - Chart Components
**Priority:** HIGH  
**Estimated Time:** 30 minutes  
**Status:** ⬜ Not Started

**Files to Edit:**
- `src/app/admin/users/page.tsx`
- `src/app/admin/dashboard/page.tsx`
- `src/app/dashboard/page.tsx`

**Pattern:**
```typescript
// Before
import { UserRoleChart } from "@/components/admin/charts/UserRoleChart";

// After
import dynamic from 'next/dynamic';

const UserRoleChart = dynamic(
    () => import('@/components/admin/charts/UserRoleChart'),
    { 
        ssr: false,
        loading: () => <Skeleton className="h-64 w-full" />
    }
);
```

**Components to Convert:**
- [ ] `UserRoleChart`
- [ ] `UserActivityChart`
- [ ] `EquityChart`
- [ ] `WinLossChart`
- [ ] `StatsOverview`

**Validation:**
- [ ] Charts still render correctly
- [ ] Bundle size reduction
- [ ] Loading skeleton displays

---

### Task 3.2: Dynamic Import - Heavy Modals
**Priority:** MEDIUM  
**Estimated Time:** 20 minutes  
**Status:** ⬜ Not Started

**Files to Audit:**
- `src/components/admin/ai/**/*.tsx`
- `src/components/admin/academy/**/*.tsx`

**Candidates:**
- [ ] `CreateLevelModal`
- [ ] `CreateModuleModal`
- [ ] `QuestionModal`
- [ ] Rich text editors

**Validation:**
- [ ] Modals open correctly
- [ ] No hydration errors

---

### Task 3.3: Lazy Load Non-Critical Components
**Priority:** LOW  
**Estimated Time:** 30 minutes  
**Status:** ⬜ Not Started

**Components:**
- [ ] `FireflyBackground` (decorative)
- [ ] `ScrollToTop` button
- [ ] Newsletter widgets

**Pattern:**
```typescript
const FireflyBackground = dynamic(
    () => import('@/components/ui/FireflyBackground'),
    { ssr: false }
);
```

---

## Phase 4: Re-render Optimization ⚛️ (2-3 hours)

### Task 4.1: Add React.memo to Static Components
**Priority:** MEDIUM  
**Estimated Time:** 45 minutes  
**Status:** ⬜ Not Started

**Files to Edit:**
- `src/components/ui/Logo.tsx`
- `src/components/shared/Logo.tsx`
- `src/components/ui/SectionHeader.tsx`

**Pattern:**
```typescript
import { memo } from 'react';

export const Logo = memo(function Logo({ variant }: LogoProps) {
    return <div>...</div>;
});
```

**Components:**
- [ ] Logo
- [ ] SectionHeader
- [ ] QuoteDisplay
- [ ] Static nav items

**Validation:**
- [ ] Use React DevTools Profiler
- [ ] Check re-render count reduction

---

### Task 4.2: Add useCallback to Event Handlers
**Priority:** MEDIUM  
**Estimated Time:** 60 minutes  
**Status:** ⬜ Not Started

**Files to Audit:**
- Search components
- Form components
- Modal components

**Pattern:**
```typescript
const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // logic here
}, [dependencies]);
```

**Files:**
- [ ] `src/components/search/SearchBar.tsx`
- [ ] `src/components/admin/articles/ArticleList.tsx`
- [ ] `src/components/dashboard/AccountSelector.tsx`

---

### Task 4.3: Implement React.cache for Auth
**Priority:** LOW  
**Estimated Time:** 30 minutes  
**Status:** ⬜ Not Started

**Files to Edit:**
- `src/lib/auth-cache.ts`

**Refactor:**
```typescript
import { cache } from 'react';

export const getAuthUser = cache(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    return await prisma.user.findUnique({
        where: { id: user.id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
        }
    });
});
```

**Validation:**
- [ ] Auth still works
- [ ] No duplicate queries in logs
- [ ] Test across multiple Server Components

---

### Task 4.4: Fix Lazy State Initialization
**Priority:** LOW  
**Estimated Time:** 30 minutes  
**Status:** ⬜ Not Started

**Pattern:**
```typescript
// Before
const [state, setState] = useState(expensiveComputation());

// After
const [state, setState] = useState(() => expensiveComputation());
```

**Files to Review:**
- [ ] `src/components/admin/articles/ArticleList.tsx`
- [ ] Components with complex initial state

---

## Phase 5: Monitoring & Validation 📈 (1 hour)

### Task 5.1: Add Performance Monitoring
**Priority:** MEDIUM  
**Estimated Time:** 20 minutes  
**Status:** ⬜ Not Started

**Action:**
- [ ] Enable Vercel Analytics
- [ ] Configure Web Vitals reporting
- [ ] Set up alerts for regressions

---

### Task 5.2: Create Performance Budget
**Priority:** LOW  
**Estimated Time:** 20 minutes  
**Status:** ⬜ Not Started

**File to Create:**
- `performance-budget.json`

**Budget:**
```json
{
    "budgets": [
        {
            "path": "/*",
            "timings": [
                { "metric": "first-contentful-paint", "budget": 2000 },
                { "metric": "largest-contentful-paint", "budget": 2500 },
                { "metric": "interactive", "budget": 3500 }
            ],
            "resourceSizes": [
                { "resourceType": "script", "budget": 200 },
                { "resourceType": "total", "budget": 400 }
            ]
        }
    ]
}
```

---

### Task 5.3: Set Up Lighthouse CI
**Priority:** LOW  
**Estimated Time:** 20 minutes  
**Status:** ⬜ Not Started

**Action:**
- [ ] Add `.lighthouserc.json`
- [ ] Configure GitHub Actions
- [ ] Set performance thresholds

---

## Progress Tracking

### Completion Status
- ⬜ Not Started
- 🟡 In Progress
- ✅ Complete
- ❌ Blocked

### Phase Summary
| Phase | Tasks | Completed | Progress |
|-------|-------|-----------|----------|
| Phase 1 | 4 | 0 | 0% |
| Phase 2 | 4 | 0 | 0% |
| Phase 3 | 3 | 0 | 0% |
| Phase 4 | 4 | 0 | 0% |
| Phase 5 | 3 | 0 | 0% |
| **Total** | **18** | **0** | **0%** |

---

## Notes & Issues

### Blockers
- None yet

### Questions
- None yet

### Decisions Made
- None yet

---

## Testing Checklist

### Before Each Task
- [ ] Create feature branch
- [ ] Run `npm run build` (baseline)
- [ ] Note current bundle size

### After Each Task
- [ ] Run `npm run build`
- [ ] Compare bundle size
- [ ] Run `npm run dev` - test functionality
- [ ] Check for console errors
- [ ] Test on mobile viewport
- [ ] Commit changes with descriptive message

### After Each Phase
- [ ] Run full test suite
- [ ] Run Lighthouse audit
- [ ] Test on staging environment
- [ ] Get team review
- [ ] Merge to main

---

## Useful Commands

```bash
# Build and analyze
npm run build
npm run build -- --analyze

# Performance testing
npm run lighthouse

# Database
npx prisma studio
npx prisma migrate dev

# Testing
npm run test
npm run test:e2e
```

---

*Last Updated: 2026-01-23*
