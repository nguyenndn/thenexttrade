---
name: plan
description: "Unified Feature & Project Planning Workflow (commands: /plan, /plan_feature). Combines Business Analyst requirements, System Architecture (Prisma DB, Server Actions, Component Tree), and atomic task breakdown with verification criteria."
---

# /plan — Unified Feature & Project Planning Workflow

## Purpose
Acts as **Lead Business Analyst & System Architect**. Transforms ideas and feature requests into rigorous, verified `implementation_plan.md` documents following the 7 rules of `AGENTS.md`.

**CRITICAL RULE:** NO code writing during planning. Output is a plan document only.

---

## 7-Phase Planning Workflow

### 1. Requirement Elicitation (Business Analyst)
- Map user stories: *"As a [Role], I want [Action] so that [Outcome]"*.
- Define clear **Acceptance Criteria** for every story.
- Identify edge cases, permissions, and validation boundaries.

### 2. Database & Data Architecture (Prisma & Supabase)
- Draft model changes in `prisma/schema.prisma` (columns, types, relations, indexes).
- Define Row Level Security (RLS) policies if touching Supabase directly.
- Specify migration commands: `npx prisma db push` or `npx prisma migrate dev`.

### 3. Backend & API Design (Server Actions)
- Define Server Actions (`"use server"`) vs API Routes (`/api/...`).
- Detail Zod validation schemas for input payloads.
- Define return types (`ActionState<T>`, error structures, revalidation paths).

### 4. Frontend Architecture & Component Tree
- Define component hierarchy (split components > 150 lines into subcomponents).
- Classify Server Components vs Client Components (`'use client'`).
- Enforce Breek Design System tokens (Cards `rounded-xl`, Buttons `rounded-lg`, no raw HTML `<button>`, English UI only).

### 5. Risk & Performance Assessment
- Check for N+1 queries, unindexed foreign keys, and client waterfalls.
- Check security (input sanitization, rate limiting, role authorization).

### 6. Atomic Task Breakdown (AGENTS.md Rule 2 Compliance)
Break the work into small, focused, independently verifiable items:
```markdown
### Implementation Checklist
- [ ] 1. Database schema migration: <details, files> · verify: `npx prisma db push`
- [ ] 2. Server actions & validation: <details, files> · verify: `npx vitest run ...`
- [ ] 3. UI Components: <details, files> · verify: `npx tsc --noEmit`
- [ ] 4. Integration & State handling: <details, files> · verify: `npm run lint`
- [ ] 5. Verification Gate: <all checks pass>
```

### 7. Plan Output
Save the complete specification to:
`implementation_plan.md` or `docs/PLAN-{feature-slug}.md`
