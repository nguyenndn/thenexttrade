---
trigger: always_on
---

# Workspace Rules & Conventions

## 1. Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Vanilla CSS where needed for custom animations)
- **Icons**: Lucide React (Strictly no emojis as icons)
- **Backend/Auth**: Supabase
- **State Management**: React Hooks (useState, useEffect) for client components

## 2. Design System: "Breek Premium" (CRITICAL)
- **Single Source of Truth**: `design/ui-guide.md` is the LAW.
- **Strict Prohibition**: You are FORBIDDEN from using generic Tailwind utility classes (e.g., `rounded`, `bg-blue-500`, `shadow`) unless they match `ui-guide.md`.
- **Mandatory Workflow**:
    1. Before writing ANY UI code, you MUST read `design/ui-guide.md` to get the exact class strings.
    2. If a specific component is not in the guide, use the "Breek Pattern": `rounded-xl` + `border-white/5` + `bg-[#00C888]` (for primary).
    3. NEVER invent new styles. If unsure, stop and check the guide file first.

## 3. Project Structure & Content Strategy
- **Content Focus**:
  - **Educational** & **Evergreen** (Tutorials, Academy, Wiki) > **News** (Time-sensitive).
  - "Market Insights" -> **"Trading Library"**.
  - "Latest Tutorials" -> **"Popular Guides"**.
- **Navigation**:
  - **Source of Truth**: `src/config/navigation.ts`.
  - Do not hardcode new top-level links without updating this config.
- **Academy Module**:
  - Structure: Basics -> Analysis -> Mastery.
  - Users follow a structured "Roadmap" (Level 1, 2, 3).

## 4. Coding Conventions
- **Components**:
  - **Reusable First**: If a UI element (like UserDropdown) appears in >1 place, create a shared component in `src/components/layout/` or `src/components/ui/`.
  - **Client vs Server**: Use Server Components for data fetching where possible. Add `'use client'` strictly when interactivity is needed.
- **Settings Pages**:
  - Use **Tabbed Interfaces** for complex/long forms (e.g., Account/Security merged into one) to avoid excessive scrolling.
- **Auth**:
  - Use `createClient` from `@/lib/supabase/client` or `server` appropriately.
  - Handle Loading/Error states explicitly in forms.

## 5. Pre-Delivery Checklist
- [ ] No emojis used as icons?
- [ ] Hover states smooth and consistent?
- [ ] Dark/Light mode compatible?
- [ ] Mobile responsive (No horizontal scroll)?
- [ ] Console clean of ReferenceErrors/Hydration errors?

## 6. Communication & Workflow Protocol
- **Language**: Always respond in **Vietnamese** (Tieng Viet).
- **Task Management**:
  - **Confirmation**: Always confirm requirements and create granular tasks before starting complex work.
  - **Q&A Mode**: If the user asks a question, **ONLY ANSWER**. Do not modify code or start tasks unless explicitly instructed.
- **Verification (QA)**:
  - **Mandatory Testing**: You MUST verify/test your changes (check build, console errors, UI rendering) BEFORE reporting "Completed".
  - **Definition of Done**: A task is only done when it has been verified to work.
