---
trigger: always_on
---

# GEMINI.md — TheNextTrade Project Rules

> Defines AI behavior for this **Next.js (App Router) + Prisma + Tailwind** trading platform.

---

VERY IMPORTANT: ALWAYS RUN COMMANDS WITH GITBASH

## 1. AGENT & SKILL PROTOCOL

> **MANDATORY:** Read the appropriate agent file and its skills BEFORE any implementation.

- **Loading:** Agent activated → Check `skills:` frontmatter → Read `SKILL.md` → Apply.
- **Priority:** P0 (GEMINI.md) > P1 (Agent .md) > P2 (SKILL.md).
- **Never skip** reading agent rules. "Read → Understand → Apply" is mandatory.

---

## 2. REQUEST CLASSIFIER

| Request Type     | Action                                          |
| ---------------- | ----------------------------------------------- |
| **QUESTION**     | Text response only                              |
| **SIMPLE CODE**  | Fix/add/change → Inline edit                    |
| **COMPLEX CODE** | Build/create/refactor → Plan first, then code   |
| **DESIGN/UI**    | UI/page/dashboard → Apply `frontend-specialist` |
| **SLASH CMD**    | `/audit`, `/debug`, etc. → Follow workflow      |

---

## 3. AGENT ROUTING (Auto)

Before ANY code or design response:

1. **Detect domain** from user request (Frontend, Backend, Security, DB, etc.)
2. **Select agent** → Apply its rules and skills
3. **Announce**: `🤖 Applying knowledge of @[agent-name]...`

| Domain                     | Agent                  | Key Skills                    |
| -------------------------- | ---------------------- | ----------------------------- |
| **UI/UX, Components, CSS** | `frontend-specialist`  | frontend-design, tailwind     |
| **API, Server Actions**    | `backend-specialist`   | api-patterns, database-design |
| **Database, Schema**       | `database-architect`   | database-design               |
| **Security, Auth**         | `security-auditor`     | vulnerability-scanner         |
| **Performance**            | `performance-optimizer`| performance-profiling         |
| **SEO**                    | `seo-specialist`       | seo-fundamentals              |
| **Debugging**              | `debugger`             | systematic-debugging          |
| **Multi-domain / Complex** | `orchestrator`         | brainstorming, plan-writing   |
| **Planning / Architecture**| `project-planner`      | plan-writing                  |

> If user mentions `@agent` explicitly, use that agent.

---

## 4. UNIVERSAL RULES (Always Active)

### 🌐 Language
- User writes Vietnamese → Respond in Vietnamese
- Code comments/variables → Always English

### 🧹 Clean Code
ALL code follows `@[skills/clean-code]`:
- Concise, self-documenting, no over-engineering
- Performance: Core Web Vitals standards
- Next.js: Server Components by default, `'use client'` only when needed

### 📁 File Awareness
Before modifying any file:
1. Check ARCHITECTURE.md for system context
2. Identify dependent files
3. Update ALL affected files together

---

## 5. SOCRATIC GATE

For complex requests, **ASK before coding**:

| Request Type        | Action                                              |
| ------------------- | --------------------------------------------------- |
| New Feature / Build | Ask minimum 3 strategic questions                   |
| Code Edit / Bug Fix | Confirm understanding + ask impact                  |
| Vague Request       | Ask Purpose, Scope, Edge Cases                      |
| Full Orchestration  | STOP → Get user confirmation before starting        |

> **Never Assume.** If unclear, ASK. Reference: `@[skills/brainstorming]`.

---

## 6. CODE RULES (When Writing Code)

### Tech Stack
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Prisma ORM + PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **UI**: Custom components + Radix UI primitives
- **Charts**: Recharts
- **Hosting**: Vercel

### Patterns
- Server Components for data fetching, Client Components for interactivity
- Server Actions for mutations (`'use server'`)
- `Promise.all` for parallel data fetching
- `unstable_cache` / `cache.wrap()` for expensive queries
- `dynamic()` imports for code splitting below-fold content
- Zod for validation (client + server)

### Design Rules
> Design rules live in agent files, NOT here.

| Task     | Read                               |
| -------- | ---------------------------------- |
| Web UI   | `.agents/agents/frontend-specialist.md` |
| SEO      | `.agents/agents/seo-specialist.md`      |

---

## 7. VERIFICATION

### Pre-Push (Mandatory)
```
npx tsc --noEmit    → 0 errors
```

### Available Scripts
| Script            | Path                              | Purpose              |
| ----------------- | --------------------------------- | -------------------- |
| `checklist.py`    | `.agents/scripts/checklist.py`    | Full project audit   |
| `verify_all.py`   | `.agents/scripts/verify_all.py`   | Comprehensive verify |
| `auto_preview.py` | `.agents/scripts/auto_preview.py` | Auto preview         |

### Workflows
Key workflows: `/audit`, `/push_code`, `/debug`, `/optimize`, `/qa`, `/code_review`

---

## 8. QUICK REFERENCE

### Agents (13)
`orchestrator` · `project-planner` · `frontend-specialist` · `backend-specialist` · `database-architect` · `security-auditor` · `seo-specialist` · `debugger` · `performance-optimizer` · `product-manager` · `documentation-writer` · `explorer-agent` · `code-archaeologist`

### Key Skills
`clean-code` · `brainstorming` · `frontend-design` · `tailwind-patterns` · `react-best-practices` · `plan-writing` · `testing-patterns` · `systematic-debugging` · `vulnerability-scanner` · `seo-fundamentals` · `performance-profiling`

---