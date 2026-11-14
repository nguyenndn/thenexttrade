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
| Border radius | `rounded-md` / `rounded-sm` on cards; bubbly `rounded-xl` on buttons | Optical hierarchy: Cards/Panels = `rounded-xl` (12px+); Buttons/Inputs = `rounded-lg` (8px) |
| Cancel/Close | `variant="ghost"` | `variant="outline"` |
| Accessibility | icon button with no label | `aria-label` |
| Input Placeholders | `placeholder="e.g. 200"` | No placeholder (rely on clear Label & Helper Text) |
| Entity Color Picker | Sprawling 2-row / 30-button sections | Prefix popover swatch `[🟢▾]` in Name input |
| Spec Lists / Info Cards | Long vertical 4-row lists | 2x2 Matrix Card (`grid-cols-2` with `divide-x/y`) |
| Telemetry Status | Rigid text badges like `Live (EA)` | Pulsing dot + relative time (`formatDistanceToNow`) |

## TECH CONVENTIONS

- **Stack:** Next.js App Router + TypeScript + Tailwind + Prisma (Postgres).
- **Type safety:** no `any` — define explicit types/interfaces.
- **Server vs Client:** maximize Server Components; only `'use client'` when interactivity is needed.
- **Forms:** `react-hook-form` + `zod`.
- **Component size:** UI > 150 lines → split into subcomponents.
- **Prisma scripts:** write CommonJS (`.cjs`) and run with `node` — never ts-node (repo has `noImplicitAny` → TS7006).

## KNOWLEDGE GRAPH (graphify) — auto-trigger

The repo carries a prebuilt code graph at `graphify-out/graph.json` (20k+ nodes). Consulting it is the
**default first step** for codebase questions, not an optional tool. The same rule lives in
`.agents/rules/graphify.md` (`trigger: always_on`) for Antigravity/Gemini, and the full command reference
is in `.agents/skills/graphify/SKILL.md`.

- **Before answering or planning** — "where does X live", "how does Y work", "what breaks if I change Z",
  or locating a symbol/route/model: run `graphify query "<question>"`. Use `graphify explain "<concept>"`
  for a focused concept and `graphify path "<A>" "<B>"` for relationships between two things.
  These return a scoped subgraph, far smaller than `GRAPH_REPORT.md` or raw grep output.
  If `path` reports no directed path, retry with `--undirected`, then fall back to `query`.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review, or when query/path/explain did
  not surface enough context. Read source files when implementing or debugging specific code.
- **After a structural change** — new/renamed/deleted files, exports, API routes, Prisma models — run
  `graphify update .` (AST-only, no API cost). Dirty `graphify-out/` files are expected and are never a
  reason to skip the graph.
- If `graphify-out/graph.json` is missing or stale, run `graphify update .` once, then continue.

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
| Graph structure changed (files/exports/routes/models) | `graphify update .` |
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
