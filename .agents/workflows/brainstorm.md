---
description: Structured brainstorming for projects and features. Explores multiple options before implementation.
---

# /brainstorm — Structured Idea Exploration

$ARGUMENTS

---

## Purpose

Activates BRAINSTORM mode for structured idea exploration. Inspired by YC Office Hours methodology (gstack/office-hours). Use before building features, designing systems, or making technical decisions.

**HARD GATE:** Do NOT write code during brainstorm. Output is a design document only.

---

## Phase 1: Context Gathering

> **🧠 Karpathy Gate (from `@skills/karpathy-principles`):**
> Before ANY exploration, explicitly state your assumptions about the request.
> If multiple interpretations exist, present them — don't pick silently.
> If a simpler framing exists, push back. Surface tradeoffs early.

1. Read relevant files (ARCHITECTURE.md, related source code)
2. Understand the user's request — what are they trying to achieve?
3. **State assumptions explicitly** — what do you believe the user wants? What are you unsure about?
4. Ask the key framing question via Socratic Gate:

> Before we dig in — what's this about?
>
> - **New Feature** — adding something to the platform
> - **Technical Decision** — architecture, database, API design
> - **Product Design** — UI/UX, user flow, page layout
> - **Refactoring** — improving existing code structure
> - **Exploration** — learning, researching, or validating an idea

**Mode mapping:**
- New Feature, Product Design → **Product Mode** (Phase 2A)
- Technical Decision, Refactoring → **Technical Mode** (Phase 2B)
- Exploration → **Explorer Mode** (Phase 2C)

---

## Phase 2A: Product Mode — Feature Brainstorm

Ask these questions **ONE AT A TIME**. STOP after each. Wait for response.

1. **Who benefits?** — Who is the primary user? What problem does this solve for them?
2. **What exists?** — What's the current state? What workaround are users doing now?
3. **What's the smallest version?** — What's the MVP that delivers value immediately?
4. **What's the 10x version?** — If no constraints, what's the dream version?
5. **What could go wrong?** — Edge cases, security, performance, UX pitfalls?

**Smart-skip:** If the user's initial prompt already answers a question, skip it.

**Escape hatch:** If user says "just do it" or provides a fully formed plan → skip to Phase 4 (Alternatives).

---

## Phase 2B: Technical Mode — Architecture Brainstorm

Ask these questions **ONE AT A TIME**. STOP after each.

1. **What's the constraint?** — Performance targets, scalability needs, budget, timeline?
2. **What patterns exist?** — What does the codebase already do for similar concerns?
3. **What's the tradeoff?** — What are we optimizing for (speed, simplicity, flexibility)?
4. **What breaks?** — What happens when things go wrong? Failure modes?

---

## Phase 2C: Explorer Mode — Open Research

Ask these questions **ONE AT A TIME**. STOP after each.

1. **What's the coolest version of this?** — What would make it delightful?
2. **Who would you show this to?** — What would make them say "whoa"?
3. **What's the fastest path to something you can share?**
4. **What existing thing is closest, and how is yours different?**

---

## Phase 3: Premise Challenge (MANDATORY)

Before proposing solutions, challenge the premises:

1. **Is this the right problem?** Could a different framing yield a simpler solution?
2. **What happens if we do nothing?** Real pain point or hypothetical?
3. **What existing code already partially solves this?** Reuse > Rebuild.

Output premises as clear statements:
```
PREMISES:
1. [statement] — agree/disagree?
2. [statement] — agree/disagree?
3. [statement] — agree/disagree?
```

Ask user to confirm. If disagreed, revise and loop back.

---

## Phase 4: Alternatives Generation (MANDATORY)

Produce 2-3 distinct approaches.

For each approach:
```
APPROACH A: [Name]
  Summary: [1-2 sentences]
  Effort:  [S/M/L/XL]
  Risk:    [Low/Med/High]
  Pros:    [2-3 bullets]
  Cons:    [2-3 bullets]
  Reuses:  [existing code/patterns]
```

Rules:
- At least 2 approaches required. 3 preferred.
- One must be **"minimal viable"** — fewest files, smallest diff, ships fastest.
- One must be **"ideal architecture"** — best long-term trajectory.
- One can be **creative/lateral** — unexpected approach, different framing.

**RECOMMENDATION:** Choose [X] because [one-line reason].

Present options. Do NOT proceed without user approval.

---

## Phase 5: Design Document

After user approves an approach, save the brainstorm result as an artifact:

```markdown
## 🧠 Brainstorm: [Topic]

### Context
[Problem statement from Phase 1-2]

### Premises
[Agreed premises from Phase 3]

### Chosen Approach: [Name]
[Details from Phase 4]

### Implementation Notes
[Key decisions, edge cases, dependencies]

### Next Steps
[Concrete action items]
```

---

## Examples

```
/brainstorm authentication system
/brainstorm database schema for copy trading
/brainstorm community page redesign
/brainstorm caching strategy for leaderboard
```

---

## Key Principles

- **No code** — this is about ideas, not implementation
- **Ask before assuming** — Socratic questioning, one at a time
- **Challenge premises** — verify the problem before solving it
- **Honest tradeoffs** — don't hide complexity
- **Visual when helpful** — use diagrams for architecture
- **Defer to user** — present options, let them decide
- **Reuse > Rebuild** — check existing codebase patterns first
