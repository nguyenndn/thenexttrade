# AI Agent Implementation Prompt

## 🎯 Mission

Nhiệm vụ của em là implement đầy đủ các trading features theo specs đã cung cấp, bao gồm cả unit tests.

---

## ⚠️ CRITICAL: Agent Rules & Skills

### Bắt buộc đọc trước khi code:

1. **`.agent/rules/rules.md`** - Workspace rules, design system, conventions
2. **`.agent/workflows/qa_process.md`** - QA workflow (Code → Lint → Test → Verify)
3. **`.agent/skills/vercel-react-best-practices/AGENTS.md`** - React performance optimization (40+ rules)
4. **`design/ui-guide.md`** - Design system "Breek Premium" (SINGLE SOURCE OF TRUTH)

### Key Rules Summary:

```
DESIGN SYSTEM "BREEK PREMIUM":
- Primary color: #00C888 (green)
- Dark backgrounds: #0F1117 / #0B0E14
- Border radius: rounded-2xl hoặc rounded-3xl (KHÔNG dùng sm/md)
- Border: border-white/5
- FORBIDDEN: Generic classes như rounded, bg-blue-500

QA WORKFLOW:
1. Code Implementation
2. pnpm lint (fix all errors)
3. pnpm test (fix failing tests)
4. Manual verify UI
5. Design compliance check
6. pnpm build (verify no errors)

REACT BEST PRACTICES (from skills):
- Eliminate waterfalls: use Promise.all() for parallel fetches
- Avoid barrel imports: import directly from file
- Use React.cache() for per-request deduplication
- Dynamic imports for heavy components
- Minimize re-renders: use functional setState
```

---

## 📋 Project Context

### Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict, no `any`)
- **Database:** PostgreSQL với Prisma ORM
- **Styling:** Tailwind CSS (theo ui-guide.md)
- **Icons:** Lucide React (KHÔNG dùng emojis làm icons)
- **Backend/Auth:** Supabase
- **Charts:** Recharts
- **Testing:** Vitest + React Testing Library
- **Date handling:** date-fns
- **State:** React hooks (useState, useEffect)
- **Toast:** Sonner

### Project Structure
```
src/
├── app/
│   ├── api/           # API routes
│   ├── dashboard/     # Dashboard pages
│   └── ...
├── components/        # React components
├── lib/               # Utilities, helpers
├── config/            # Navigation, constants
└── types/             # TypeScript types

prisma/
├── schema.prisma      # Database schema
└── migrations/        # SQL migrations

tests/                 # Integration tests
```

### Existing Code Patterns

**API Route Pattern:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ... logic
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

**Component Pattern:**
```typescript
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export function MyComponent() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/...");
      const json = await res.json();
      setData(json);
    } catch (error) {
      toast.error("Failed to load");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  
  return <div>...</div>;
}
```

---

## 📁 Spec Files to Implement

Implement theo thứ tự priority:

### Priority 1 (Core - Làm trước)
1. `docs/specs/ANALYTICS_DASHBOARD_DETAILED_SPEC.md`
2. `docs/specs/STRATEGY_TRACKING_DETAILED_SPEC.md`

### Priority 2 (Important)
3. `docs/specs/PSYCHOLOGY_TRACKING_DETAILED_SPEC.md`
4. `docs/specs/RISK_CALCULATOR_DETAILED_SPEC.md`
5. `docs/specs/SESSION_ANALYSIS_DETAILED_SPEC.md`

### Priority 3 (Nice-to-Have)
6. `docs/specs/MISTAKE_TRACKING_DETAILED_SPEC.md`
7. `docs/specs/EXPORT_REPORTS_DETAILED_SPEC.md`

---

## 🔧 Implementation Steps (For Each Feature)

### Step 1: Database Changes
```bash
# 1. Read the spec's "Database Changes" section
# 2. Update prisma/schema.prisma
# 3. Run migration
npx prisma migrate dev --name <feature_name>
npx prisma generate
```

### Step 2: Create Library Files
- Create utility files in `src/lib/`
- Create test files alongside: `src/lib/<name>.test.ts`
- Run tests: `pnpm vitest run src/lib/<name>.test.ts`

### Step 3: Create API Routes
- Create route files in `src/app/api/`
- Create test files: `src/app/api/<route>/route.test.ts`
- Test with curl or Postman

### Step 4: Create Components
- Create component folder in `src/components/`
- Create test files: `src/components/<name>/<Component>.test.tsx`
- Export from `index.ts`

### Step 5: Create Page
- Create page in `src/app/dashboard/<feature>/page.tsx`
- Import main component

### Step 6: Update Navigation
- Add menu item in `src/config/navigation.ts`

### Step 7: Run All Tests
```bash
pnpm test --run
```

---

## ✅ Checklist Per Feature (QA Process)

Theo `.agent/workflows/qa_process.md`:

```
□ 1. CODE IMPLEMENTATION
   □ Implement changes
   □ Strict type safety (no `any`)

□ 2. STATIC CODE VERIFICATION
   □ Run: pnpm lint
   □ Fix all errors before proceeding

□ 3. AUTOMATED TESTING
   □ Run: pnpm test
   □ Fix any failing tests

□ 4. MANUAL VERIFICATION
   □ Check UI/UX in browser
   □ Check responsiveness
   □ Check visual elements

□ 5. DESIGN COMPLIANCE CHECK (CRITICAL)
   □ No generic classes (rounded, bg-blue-500)?
   □ Primary buttons use #00C888 + shadow?
   □ Dark backgrounds use #0F1117 / #0B0E14?
   □ Border radius is rounded-2xl or rounded-3xl?
   □ Matches design/ui-guide.md?

□ 6. FINAL REVIEW
   □ pnpm lint passes
   □ pnpm build succeeds
   □ Console clean of errors

□ 7. PRE-DELIVERY CHECKLIST
   □ No emojis used as icons?
   □ Hover states smooth?
   □ Dark/Light mode works?
   □ Mobile responsive (no horizontal scroll)?
   □ Console clean of ReferenceErrors/Hydration errors?
```

---

## 🧪 Testing Requirements

### Unit Tests
- Mỗi function trong `src/lib/` cần test
- Mỗi API route cần test calculations
- Mỗi component cần basic render tests

### Test File Naming
```
src/lib/calculators.ts        → src/lib/calculators.test.ts
src/components/Foo/Bar.tsx    → src/components/Foo/Bar.test.tsx
src/app/api/analytics/route.ts → tests/api/analytics.test.ts
```

### Run Tests
```bash
# All tests
pnpm test

# Specific file
pnpm vitest run src/lib/calculators.test.ts

# Watch mode
pnpm vitest

# Coverage
pnpm test --coverage
```

---

## 🎨 Styling Guidelines (from design/ui-guide.md)

### CRITICAL: Design System "Breek Premium"

**Đọc file `design/ui-guide.md` TRƯỚC KHI viết UI code!**

### Colors
- Primary: `#00C888` (green)
- Background Dark: `#0B0E14` / `#0F1117`
- Text Dark: `text-gray-900 dark:text-white`
- Subtext: `text-gray-500`
- Border Dark: `border-white/5`

### Component Styling
```tsx
// Card - CORRECT
<div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">

// Button Primary - CORRECT
<button className="px-4 py-2 bg-[#00C888] text-white font-bold rounded-xl hover:bg-[#00B377] shadow-lg">

// Input - CORRECT
<input className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
```

### FORBIDDEN Patterns (DO NOT USE)
```tsx
// ❌ WRONG - Generic rounded
<div className="rounded">

// ❌ WRONG - Generic blue
<button className="bg-blue-500">

// ❌ WRONG - Small rounded
<div className="rounded-sm rounded-md">

// ✅ CORRECT - Use rounded-2xl or rounded-3xl
<div className="rounded-2xl">
```

---

## ⚡ React Performance Rules (from skills)

Theo `.agent/skills/vercel-react-best-practices/AGENTS.md`:

### CRITICAL - Eliminating Waterfalls
```typescript
// ❌ WRONG - Sequential (slow)
const user = await fetchUser();
const orders = await fetchOrders();

// ✅ CORRECT - Parallel (fast)
const [user, orders] = await Promise.all([
  fetchUser(),
  fetchOrders(),
]);
```

### CRITICAL - Bundle Size
```typescript
// ❌ WRONG - Barrel import
import { Button, Modal, Table } from "@/components/ui";

// ✅ CORRECT - Direct import
import { Button } from "@/components/ui/Button";
```

### HIGH - Dynamic Import for Heavy Components
```typescript
// ✅ CORRECT - Lazy load charts
const ChartComponent = dynamic(
  () => import("@/components/charts/EquityCurve"),
  { loading: () => <ChartSkeleton /> }
);
```

### MEDIUM - Use React.cache() for Deduplication
```typescript
import { cache } from "react";

export const getUser = cache(async (userId: string) => {
  return await db.user.findUnique({ where: { id: userId } });
});
```

---

## 📝 Commit Pattern

```
feat(analytics): add analytics dashboard with KPIs
feat(analytics): add equity curve chart
test(analytics): add unit tests for analytics API
feat(strategy): add strategy CRUD operations
test(strategy): add strategy tracking tests
...
```

---

## ⚠️ Important Notes

1. **Read agent files first** - Đọc `.agent/rules/rules.md` và `design/ui-guide.md` trước khi code
2. **Read spec carefully** - Mỗi spec có đầy đủ code, copy và adjust
3. **QA workflow** - Follow `.agent/workflows/qa_process.md` cho mỗi feature
4. **Test từng step** - Không skip testing (`pnpm lint` → `pnpm test`)
5. **Check dark mode** - Mọi component phải work ở cả 2 modes
6. **Mobile first** - Responsive design (no horizontal scroll)
7. **Error handling** - Mọi API call cần try/catch
8. **Loading states** - Show skeleton khi loading
9. **Empty states** - Handle khi không có data
10. **TypeScript strict** - Không dùng `any`
11. **Icons** - Chỉ dùng Lucide React, KHÔNG dùng emojis làm icons
12. **Performance** - Follow React best practices từ `.agent/skills/`

---

## 📚 Required Reading (BEFORE CODING)

```bash
# 1. Workspace Rules & Conventions
cat .agent/rules/rules.md

# 2. QA Process Workflow
cat .agent/workflows/qa_process.md

# 3. Design System (CRITICAL)
cat design/ui-guide.md

# 4. React Best Practices (40+ rules)
cat .agent/skills/vercel-react-best-practices/AGENTS.md
```

---

## 🚀 Start Command

```bash
# 1. Clone/pull latest code
git pull origin main

# 2. Install dependencies
pnpm install

# 3. Read required files
cat .agent/rules/rules.md
cat design/ui-guide.md

# 4. Start dev server
pnpm dev

# 5. Run tests in watch mode
pnpm vitest

# 5. Start implementing from first spec!
```

---

## 📞 When Stuck

Nếu gặp vấn đề:
1. Re-read spec section liên quan
2. Check existing similar code trong project
3. Run tests để xem error message
4. Check console/terminal logs

---

**Ready? Bắt đầu với `ANALYTICS_DASHBOARD_DETAILED_SPEC.md` ngay!**
