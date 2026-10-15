# Academy Navigation Visibility & Re-opening Guide

> **Status:** 🟡 **TEMPORARILY HIDDEN** (Tạm ẩn khỏi Menu Trader Dashboard)  
> **Date:** October 2026  
> **Applies to:** Trader Dashboard Navigation (`dashboardMenuItems`, `dashboardMenuGroups`), Settings (`/dashboard/settings/trading-style`)

---

## 1. Overview & Context (Tổng Quan)

Per product instruction, the **Academy** menu item has been **temporarily hidden** from the user-facing Dashboard navigation (desktop sidebar and mobile bottom tab bar / drawer).

### Key Takeaways:
- **Routes & Data are 100% Intact:** All underlying Academy code, database models (`Course`, `Module`, `Lesson`, `Quiz`), API actions, public pages (`/academy`), and dashboard routes (`/dashboard/academy`) remain fully operational.
- **Admin Management Remains Active:** The Admin navigation item at `/admin/academy` is completely retained so administrators can continue curating lessons, quizzes, and certificates.
- **Trading Style Assessment Decoupled:** In `dashboard/settings/trading-style`, all dependencies on Academy have been cleanly redirected to **Trading Rules** (`/dashboard/rules`), ensuring traders get actionable behavioral guardrails without hitting hidden learning routes.

---

## 2. Changes Implemented (Chi Tiết Thay Đổi)

### A. Navigation Configuration (`src/config/navigation.ts`)
The Academy menu entries have been commented out in two specific locations:
1. **Desktop Sidebar (`dashboardMenuItems` under `// --- GROWTH ---`):**
   ```ts
   // --- GROWTH ---
   // Temporarily hidden: Academy (will be reopened later per user request)
   // {
   //     name: "Academy",
   //     href: "/dashboard/academy",
   //     icon: GraduationCap,
   //     requiresTradeData: false,
   // },
   ```
2. **Mobile Tab Bar & More Group (`dashboardMenuGroups` under `More`):**
   ```ts
   // Temporarily hidden: Academy (will be reopened later per user request)
   // {
   //     name: "Academy",
   //     href: "/dashboard/academy",
   //     icon: GraduationCap,
   // },
   ```

### B. Trading Style Settings (`dashboard/settings/trading-style`)
1. **Removed Top Badge:** Removed the `<div className="...">Behavioral Correction Plan</div>` badge in `src/components/trading-style/PrescriptionCard.tsx`.
2. **Step 3 Behavioral Rewiring:** Refactored Step 3 to "Execution Rulebook Protocol" with icon `<ClipboardCheck />`, badge `"Rulebook Protocol"`, and CTA linking to `/dashboard/rules`.
3. **Archetype Moves & Prescriptions (`src/config/trading-style-data.ts`):** All 8 archetypes' `keystone`, `moves`, and `prescription.lesson` items have been updated to point to `/dashboard/rules`, `/dashboard/journal`, or `/dashboard/strategies`, removing direct user links to `/academy`.

---

## 3. How to Re-open Academy (Hướng Dẫn Mở Lại Menu Academy)

When ready to officially re-launch the Academy to all traders:

1. **Re-enable in Navigation:**
   In `src/config/navigation.ts`:
   - Uncomment the `Academy` block in `dashboardMenuItems` (under `// --- GROWTH ---`).
   - Uncomment the `Academy` block in `dashboardMenuGroups` (under `More`).
2. **(Optional) Re-link Archetype Prescriptions:**
   If you wish to have Step 3 in `PrescriptionCard.tsx` point directly to Academy lessons again:
   - In `src/config/trading-style-data.ts`, restore `prescription.lesson.href` to `/academy/lesson/[slug]` and badges to `"Academy Level X"`.
   - In `src/components/trading-style/PrescriptionCard.tsx`, update Step 3 link to `rx.lesson.href` and change button label to `rx.lesson.actionLabel`.
3. **Verification:**
   Run the standard verification commands:
   ```bash
   npx tsc --noEmit
   npm run lint
   npx vitest run src/lib/trading-style/
   ```
