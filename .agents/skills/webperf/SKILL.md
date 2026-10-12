---
name: webperf
description: Web performance and Core Web Vitals audit workflow based on Addy Osmani's agent skills. Audits LCP, INP, CLS, TTFB, bundle bloat, waterfall requests, and rendering bottlenecks using a strict measure-first discipline.
---

# /webperf — Core Web Vitals & Web Performance Auditor

## Purpose
Enforces high-performance engineering standards across Next.js and web applications. Identifies bottlenecks in Core Web Vitals (LCP, INP, CLS), client waterfalls, bundle bloat, and redundant re-renders.

> **Core Philosophy:** "Measure first, optimize second." Intuition is often wrong about performance. Profile before changing code, and verify with hard metrics after.

---

## 🎯 Core Web Vitals Targets

| Metric | Good (Target) | Needs Improvement | Poor | Primary Causes |
| :--- | :--- | :--- | :--- | :--- |
| **LCP** (Largest Contentful Paint) | **≤ 2.5s** | 2.5s - 4.0s | > 4.0s | Slow server response, render-blocking resources, unoptimized hero images/SVGs |
| **INP** (Interaction to Next Paint) | **≤ 200ms** | 200ms - 500ms | > 500ms | Long JS tasks on main thread, heavy event handlers, un-memoized component trees |
| **CLS** (Cumulative Layout Shift) | **≤ 0.1** | 0.1 - 0.25 | > 0.25 | Images/embeds without explicit width/height, dynamic banners, late-loading web fonts |
| **TTFB** (Time to First Byte) | **≤ 800ms** | 800ms - 1.8s | > 1.8s | Sequential database queries, un-cached SSR routes, heavy backend cold starts |

---

## 🔍 Audit Checklist (4-Axis Analysis)

### 1. Waterfalls & Data Fetching (CRITICAL)
- [ ] **No Sequential Await:** Parallelize independent server data fetching with `Promise.all([fetchA(), fetchB()])`.
- [ ] **Server Components by Default:** Fetch data on the server; pass down plain JSON to client components.
- [ ] **Streaming & Suspense:** Wrap slow components with `<Suspense fallback={<Skeleton />}>` so critical page shell renders instantly.

### 2. Bundle Size & Code Splitting (CRITICAL)
- [ ] **Dynamic Imports:** Use `dynamic(() => import(...), { ssr: false })` for heavy below-the-fold content, large modals, and charting libraries (e.g. Recharts, TradingView).
- [ ] **Barrel File Hygiene:** Avoid importing from barrel index files when only one utility is needed (e.g. import directly from `lucide-react/dist/esm/icons/...` or ensure tree-shaking is active).
- [ ] **No Giant Vendor Bloat:** Audit `npm package.json` for redundant or duplicate dependencies (e.g. moment vs date-fns, lodash vs native JS).

### 3. Rendering & React Efficiency (HIGH)
- [ ] **State Colocation:** Keep state close to where it is used. Avoid elevating transient state to parent layouts.
- [ ] **Derived State Over Synchronization:** Compute values during render instead of syncing via `useEffect` + `setState`.
- [ ] **Virtualization for Long Lists:** Use virtual scrolling for feeds, tables, or log streams exceeding 100 items.

### 4. Assets & Media (HIGH)
- [ ] **Next.js Image Component:** Always specify `width` and `height` or `fill` with `sizes`.
- [ ] **Hero Priority:** Add `priority` prop ONLY to the 1-2 visible above-the-fold images. All other images must be lazy-loaded.
- [ ] **Font Optimization:** Use `next/font/google` with `display: 'swap'` and preload subsets.

---

## 🛠️ Step-by-Step Performance Audit Protocol

1. **Step 1 — Baseline Inspection:** Inspect bundle output (`npm run build` or analyzer) to identify the largest route chunks.
2. **Step 2 — Code Pattern Review:** Scan target route/component against the 4-Axis Checklist above.
3. **Step 3 — Formulate Action Plan:** Group findings into:
   - 🔴 **P0 (Immediate ROI):** Waterfalls, oversized initial bundle, missing image dimensions.
   - 🟠 **P1 (High):** Component code-splitting via `dynamic()`, memoizing expensive calculations.
   - 🟡 **P2 (Polish):** Micro-optimizations, SVG payload reductions.
4. **Step 4 — Implement & Verify:** Apply surgical fixes, run `npx tsc --noEmit` and build test to prove bundle reduction.
