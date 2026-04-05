# TheNextTrade — Architecture

> AI Agent system for the **TheNextTrade** platform (Next.js 15 + Prisma + Tailwind v4).

---

## Directory Structure

```
.agents/
├── ARCHITECTURE.md          # This file
├── agents/                  # 13 Specialist Agents
├── skills/                  # 23 Skills
├── workflows/               # 15 Slash Commands
├── rules/                   # Global Rules (GEMINI.md)
└── scripts/                 # 4 Validation Scripts
```

---

## Agents (13)

| Agent                  | Focus                    | Key Skills                                       |
| ---------------------- | ------------------------ | ------------------------------------------------ |
| `orchestrator`         | Multi-agent coordination | brainstorming, plan-writing                      |
| `project-planner`      | Discovery, task planning | brainstorming, plan-writing                      |
| `frontend-specialist`  | Web UI/UX                | frontend-design, tailwind-patterns, react        |
| `backend-specialist`   | API, Server Actions      | api-patterns, database-design                    |
| `database-architect`   | Schema, Prisma           | database-design                                  |
| `security-auditor`     | Security, Auth           | vulnerability-scanner                            |
| `seo-specialist`       | SEO, Ranking             | seo-fundamentals                                 |
| `debugger`             | Root cause analysis      | systematic-debugging                             |
| `performance-optimizer`| Speed, Web Vitals        | performance-profiling                            |
| `product-manager`      | Requirements, stories    | plan-writing, brainstorming                      |
| `documentation-writer` | Docs, manuals            | documentation-templates                          |
| `explorer-agent`       | Codebase analysis        | —                                                |
| `code-archaeologist`   | Legacy code, refactoring | clean-code, code-review-checklist                |

---

## Skills (23)

### Frontend & UI
| Skill | Description |
| ----- | ----------- |
| `frontend-design` | UI/UX patterns, design systems |
| `tailwind-patterns` | Tailwind CSS v4 utilities |
| `nextjs-react-expert` | React & Next.js optimization |
| `vercel-react-best-practices` | Vercel engineering patterns |
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
| `plan-writing` | Task planning, breakdown |
| `intelligent-routing` | Auto agent selection |
| `behavioral-modes` | Agent operational modes |
| `systematic-debugging` | 4-phase debugging methodology |

### Infrastructure & Tools
| Skill | Description |
| ----- | ----------- |
| `deployment-procedures` | Deploy workflows, rollback |
| `powershell-windows` | Windows PowerShell patterns |
| `documentation-templates` | Doc formats, README |
| `gstack` | Headless browser for QA testing |

---

## Workflows (15)

| Command | Description |
| ------- | ----------- |
| `/audit` | Master audit (Code Review → Optimize → QA → Sign-off) |
| `/brainstorm` | Structured brainstorming |
| `/code_review` | Senior code review |
| `/debug` | Systematic debugging |
| `/deploy` | Vercel deployment |
| `/login` | Auto-login for testing |
| `/optimize` | UI/UX + Code + Mobile optimization |
| `/plan` | Create project plan |
| `/plan_feature` | Business analyst feature planning |
| `/push_code` | Git commit + push (Conventional Commits) |
| `/qa` | Test planning + automated tests |
| `/status` | Project status board |
| `/super_dev` | Full-stack feature implementation |
| `/tech_lead` | Technical team leader workflow |
| `/update-gstack` | Update gstack skills |

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
| Plan | `project-planner` | brainstorming, plan-writing |
| Testing | Use `/qa` workflow | testing-patterns, webapp-testing |
