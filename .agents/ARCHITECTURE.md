# TheNextTrade — Architecture

> AI Agent system for the **TheNextTrade** platform (Next.js 15 + Prisma + Tailwind v4).

---

## Directory Structure

```
.agents/
├── ARCHITECTURE.md          # This file
├── agents/                  # 13 Specialist Agents
├── skills/                  # 39 Skills (23 Domain Skills + 16 Slash Command Skills)
├── workflows/               # Legacy Workflows (Archived as .bak)
├── rules/                   # Global Rules (GEMINI.md)
└── scripts/                 # 4 Validation Scripts
```

---

## Agents (13)

| Agent                  | Focus                    | Key Skills                                       |
| ---------------------- | ------------------------ | ------------------------------------------------ |
| `orchestrator`         | Multi-agent coordination | brainstorming, plan                              |
| `project-planner`      | Discovery, task planning | brainstorming, plan                              |
| `frontend-specialist`  | Web UI/UX                | frontend-design, tailwind-patterns, react        |
| `backend-specialist`   | API, Server Actions      | api-patterns, database-design                    |
| `database-architect`   | Schema, Prisma           | database-design                                  |
| `security-auditor`     | Security, Auth           | vulnerability-scanner                            |
| `seo-specialist`       | SEO, Ranking             | seo-fundamentals                                 |
| `debugger`             | Root cause analysis      | systematic-debugging                             |
| `performance-optimizer`| Speed, Web Vitals        | performance-profiling                            |
| `product-manager`      | Requirements, stories    | plan, brainstorming                              |
| `documentation-writer` | Docs, manuals            | documentation-templates                          |
| `explorer-agent`       | Codebase analysis        | —                                                |
| `code-archaeologist`   | Legacy code, refactoring | clean-code, code-review-checklist                |

---

## Skills (39)

### Frontend & UI
| Skill | Description |
| ----- | ----------- |
| `frontend-design` | UI/UX patterns, design systems |
| `tailwind-patterns` | Tailwind CSS v4 utilities |
| `nextjs-react-expert` | React & Next.js optimization (Vercel) |
| `webperf` | Core Web Vitals & performance auditing |
| `web-design-guidelines` | Web UI audit (accessibility, UX) |

### Backend & Data
| Skill | Description |
| ----- | ----------- |
| `api-patterns` | REST, Server Actions, response formats |
| `database-design` | Schema design, indexing, Prisma |

### Quality & Testing
| Skill | Description |
| ----- | ----------- |
| `testing-patterns` | Vitest, strategies |
| `webapp-testing` | E2E, Playwright |
| `code-review-checklist` | Code review standards |
| `clean-code` | Coding standards (Global) |
| `code-simplify` | Code simplification & anti-complexity (Addy Osmani) |

### Security & Performance
| Skill | Description |
| ----- | ----------- |
| `vulnerability-scanner` | OWASP, security auditing |
| `performance-profiling` | Web Vitals, optimization |
| `seo-fundamentals` | SEO, E-E-A-T, Core Web Vitals |

### Planning & Process
| Skill | Description |
| ----- | ----------- |
| `brainstorming` | Socratic questioning protocol |
| `plan` | Feature & project planning, breakdown |
| `intelligent-routing` | Auto agent selection |
| `behavioral-modes` | Agent operational modes |
| `systematic-debugging` | 4-phase debugging methodology |

### Infrastructure & Tools
| Skill | Description |
| ----- | ----------- |
| `context7` | Up-to-date documentation retrieval (Next.js 15, Prisma) |
| `graphify` | Codebase Knowledge Graph AST mapping |
| `deployment-procedures` | Deploy workflows, rollback |
| `powershell-windows` | Windows PowerShell patterns |
| `documentation-templates` | Doc formats, README |
| `gstack` | Headless browser for QA testing |

### Slash Commands & Workflows (16 Skills)
> Migrated from legacy `.agents/workflows/` to standard Agent Skills (`.agents/skills/<name>/SKILL.md`) per [Antigravity Migration Guide](https://antigravity.google/docs/migration/workflows-to-skills/).
> Slash commands retain identical invocations (`/dev`, `/qa`, etc.).

| Command / Skill | Description |
| --------------- | ----------- |
| `/audit` | Master audit (Code Review → Optimize → QA → Sign-off) |
| `/brainstorm` | Structured brainstorming for projects and features |
| `/code_review` | Senior code review and maintainer workflow |
| `/content_academy` | Academy content writing & review pipeline |
| `/debug` | Systematic problem investigation |
| `/deploy` | Automated Vercel deployment |
| `/dev` | Full-stack feature implementation & complex bug fixing |
| `/login` | Auto-login browser session for testing |
| `/optimize` | UI/UX + Code + Mobile optimization |
| `/plan` | Project plan generation via project-planner |
| `/plan_feature` | Business analyst & system architect feature planning |
| `/push_code` | Git commit + push (Conventional Commits) |
| `/qa` | Unified QA (Test Planning + Automated Tests + Verification) |
| `/status` | Agent & project status tracking |
| `/tech_lead` | Technical team leader orchestration workflow |
| `/update-gstack` | Update gstack skills to latest version |

---

## Legacy Workflows (Archived)

All 16 workflows previously located in `.agents/workflows/*.md` have been migrated to individual Agent Skills and archived as `.bak` (`.agents/workflows/*.md.bak`) for backward compatibility and disaster recovery.

---

## Scripts (4)

| Script | Purpose | Usage |
| ------ | ------- | ----- |
| `checklist.py` | Priority-based project audit | `python .agents/scripts/checklist.py .` |
| `verify_all.py` | Comprehensive verification | `python .agents/scripts/verify_all.py .` |
| `auto_preview.py` | Auto preview changes | `python .agents/scripts/auto_preview.py` |
| `session_manager.py` | Session management | `python .agents/scripts/session_manager.py` |

---

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| **Framework** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Database** | Prisma ORM + PostgreSQL (Supabase) |
| **Auth** | Supabase Auth |
| **UI** | Custom components + Radix UI |
| **Charts** | Recharts |
| **Hosting** | Vercel |

---

## Quick Reference

| Need | Agent | Skills |
| ---- | ----- | ------ |
| Web UI | `frontend-specialist` | frontend-design, tailwind-patterns |
| API/Actions | `backend-specialist` | api-patterns, database-design |
| Database | `database-architect` | database-design |
| Security | `security-auditor` | vulnerability-scanner |
| SEO | `seo-specialist` | seo-fundamentals |
| Debug | `debugger` | systematic-debugging |
| Plan | `project-planner` | brainstorming, plan |
| Testing | Use `/qa` workflow | testing-patterns, webapp-testing |
