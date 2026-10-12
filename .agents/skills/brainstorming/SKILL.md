---
name: brainstorming
description: Unified Brainstorming & Socratic Idea Exploration (commands: /brainstorm, /brainstorming). Explores product & technical options, asks 3 framing questions with trade-offs before implementation.
---

# /brainstorm — Unified Idea Exploration & Socratic Gate

## Purpose
Combines Socratic Questioning with structured YC-style idea exploration. Use before building features, making technical architecture decisions, or refining vague requirements.

**HARD RULE:** NO code writing during brainstorm. Output is a structured design document.

---

## Phase 1: Context Gathering & Karpathy Gate
1. Read relevant system files (`ARCHITECTURE.md`, target source files).
2. Understand the user's ultimate goal.
3. **State assumptions explicitly** — What do you believe the user wants? Where is the ambiguity?
4. Determine the exploration mode:
   - **Product Mode:** User flows, MVP scope, 10x features.
   - **Technical Mode:** Architecture, DB schema, API design, tech tradeoffs.
   - **Explorer Mode:** Feasibility research, learning, validating concepts.

---

## Phase 2: Socratic Gate (Minimum 3 Questions)
Before any implementation, ask minimum 3 strategic questions formatted with tradeoffs:
- 🎯 **Purpose:** What specific problem are we solving?
- 👥 **Audience:** Who will use this and how?
- 📦 **Scope:** Must-have (MVP) vs nice-to-have?

### Question Format
```markdown
### [PRIORITY] **[DECISION POINT]**
**Question:** [Clear question]
**Why This Matters:** [Architectural / UX consequence]
**Options:**
| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| A | [+] | [-] | [Use case] |
| B | [+] | [-] | [Use case] |
**If Not Specified:** [Default + rationale]
```

---

## Phase 3: Mode-Specific Deep Dive

### 3A. Product Mode (Feature Exploration)
- What is the smallest viable version (MVP) that delivers immediate value?
- What is the 10x dream version?
- What are the UX pitfalls and edge cases?

### 3B. Technical Mode (Architecture Decisions)
- Compare architectural options (e.g. Server Action vs API Route, Redis vs Postgres polling).
- Evaluate operational complexity, security, and scaling bottlenecks.
- Check compliance with Breek Design System and tech conventions.

---

## Phase 4: Decision Document Output
Output a concise design summary:
1. **Selected Direction & Rationale**
2. **Key Architectural Choices**
3. **Scope Definition (In-scope vs Deferred)**
4. **Next Steps:** Suggest running `/plan` to proceed with implementation.
