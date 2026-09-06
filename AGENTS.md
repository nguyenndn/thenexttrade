# AGENTS.md — Standing Execution Contract

> This file is a **binding execution contract** for every AI coding tool working in this repo
> (Gemini/Antigravity, Claude Code, Cursor, Copilot, …). Read it before any task. If a prompt,
> plan, or workflow contradicts a rule here → **the rule wins**.
>
> ⚠️ Bản giải thích tiếng Việt (vì sao AI hay code thiếu + cách dùng): `docs/AI-CODING-CONTRACT.md`

---

## THE LAW — 7 rules (vi phạm = chưa xong, KHÔNG phải "xong rồi mà thiếu")

### RULE 1 · READ BEFORE EDIT
- Read the **full** file before editing it. Read every file the plan mentions **and** the
  nearest existing pattern (schema, actions, components, API routes, styles, tests) so new
  code matches the codebase. Never invent a parallel structure that already exists.

### RULE 2 · RESTATE THE PLAN AS A CHECKLIST (first message)
- Copy **every step** of the plan into a numbered checklist in your first reply. Any step
  carrying several deliverables → split into its own line items.
- NEVER merge, drop, or "simplify" an item. The checklist is the single yardstick you audit
  against at the end.

### RULE 3 · WORK ITEM BY ITEM, POST PROGRESS
- For each item: read → change → verify → tick. Post progress as you go:
  `[x] item 3: <what changed, which file> · verify: <command / output>`

### RULE 4 · VERIFY EVERY CHANGE — "done" ≠ "code written"
- Run the plan's verify command. If the plan names none, run the repo's cheapest proof the
  code compiles: `npx tsc --noEmit`, then `npm run lint`. If the task changes behavior, also
  run the relevant test/build command.
- A step is **DONE only when its verify command passes**. Fix failures before moving on.
- **NO AUTOMATIC BROWSER TESTING**: Never launch or interact with browser/DevTools MCP automatically for routine verification. Only test in browser when explicitly requested by user.

### RULE 5 · NO SILENT SKIPS, NO SURPRISE EXTRAS
- Every item is either **DONE** (verified) or **BLOCKED** (exact reason + what would unblock).
  "Partially done" is NOT done. There is no gray zone.
- Do NOT add, refactor, rename, or "improve" anything that is not in the plan.
- If an instruction is ambiguous or impossible → **STOP and report**. Do not improvise a
  substitute and call it complete.

### RULE 6 · SELF-AUDIT YOUR DIFF BEFORE FINISHING
- Re-read your **own diff** against the checklist. Every planned change must be present in
  the diff; anything not in the plan must be removed or explicitly justified.
- Check the easy-to-forget "joints": new imports actually exported, new API routes reachable,
  new fields present in types **and** forms **and** DB, DB rows updated **and** reflected in UI.

### RULE 7 · FINAL REPORT (mandatory — use the template at the bottom)
- One line per checklist item: `DONE` (what changed, which files, verify command) or
  `BLOCKED` (why + what unblocks).
- One line: "Plan items NOT done" (list or "none").
- One line: "Changes NOT in the plan" (must be "none").

---

## DESIGN SYSTEM (the UI law — applies to every UI change)

→ `design/ui-guide.md` — Breek Premium Design System (read it in full for any UI work).

| Rule | ❌ Wrong | ✅ Right |
|---|---|---|
| Language | Vietnamese text in UI | English only |
| Button | raw `<button>` HTML | `<Button>` from `@/components/ui/Button` |
| Dropdown | native `<select>` | `<DropdownMenu>` |
| Icons | Emoji 🚀📈 | `lucide-react` |
| Border radius | `rounded-md` / `rounded-sm` | `rounded-xl` minimum |
| Cancel/Close | `variant="ghost"` | `variant="outline"` |
| Accessibility | icon button with no label | `aria-label` |

## TECH CONVENTIONS

- **Stack:** Next.js App Router + TypeScript + Tailwind + Prisma (Postgres).
- **Type safety:** no `any` — define explicit types/interfaces.
- **Server vs Client:** maximize Server Components; only `'use client'` when interactivity is needed.
- **Forms:** `react-hook-form` + `zod`.
- **Component size:** UI > 150 lines → split into subcomponents.
- **Prisma scripts:** write CommonJS (`.cjs`) and run with `node` — never ts-node (repo has `noImplicitAny` → TS7006).

## PRIORITY WHEN RULES CONFLICT

```
AGENTS.md (execution contract)  →  the plan / implementation_plan.md  →  conventions  →  design/ui-guide.md
```

Never drop an item from the plan to "improve" something else. Every plan item must be DONE or reported BLOCKED with a reason.

---

## Repo-specific verify commands

| When | Command |
|---|---|
| Type check (every TS change) | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Prisma schema changed | `npx prisma generate` (+ `migrate`/`db push` if the plan says so) |
| Academy content / publish scripts | `node prisma/*.cjs` (CommonJS — run with **node**, never ts-node) |
| Large change (production sanity) | `npm run build` |
| Tests (if present) | `npx vitest run` |

---

## Final report template (copy exactly)

```markdown
## ✅ Execution Report
For each checklist item:
  [x] <item> — DONE: <what changed, which files> · verified via <command>
  [ ] <item> — BLOCKED: <exact reason + what unblocks>
Plan items NOT done: <list or "none">
Changes NOT in the plan: <list or "none">
```
