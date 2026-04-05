---
name: intelligent-routing
description: Automatic agent selection and intelligent task routing. Analyzes user requests and automatically selects the best specialist agent(s) without requiring explicit user mentions.
version: 2.0.0
---

# Intelligent Agent Routing

**Purpose**: Automatically analyze user requests and route them to the most appropriate specialist agent(s).

## How It Works

1. **Analyze** user request (silent — no verbose meta-commentary)
2. **Select** the best agent(s) based on domain detection
3. **Announce**: `🤖 Applying knowledge of @[agent-name]...`
4. **Apply** the selected agent's rules and skills

## Agent Selection Matrix

| User Intent | Keywords | Selected Agent(s) |
| ----------- | -------- | ------------------ |
| **UI/UX** | component, layout, style, tailwind, responsive | `frontend-specialist` |
| **API/Actions** | endpoint, route, server action, POST, GET | `backend-specialist` |
| **Auth/Security** | login, auth, signup, password, vulnerability | `security-auditor` + `backend-specialist` |
| **Database** | schema, migration, query, prisma, table | `database-architect` |
| **Bug Fix** | error, bug, not working, broken, crash | `debugger` |
| **Performance** | slow, optimize, performance, speed, cache | `performance-optimizer` |
| **SEO** | seo, meta, sitemap, robots, ranking | `seo-specialist` |
| **New Feature** | build, create, implement (multi-domain) | `orchestrator` → ASK FIRST |
| **Complex Task** | Multiple domains detected | `orchestrator` → ASK FIRST |

## Domain Detection

| Domain | Patterns | Agent |
| ------ | -------- | ----- |
| **Frontend** | react, next.js, css, tailwind, component, UI | `frontend-specialist` |
| **Backend** | api, server action, prisma, data fetching | `backend-specialist` |
| **Database** | schema, migration, query, index | `database-architect` |
| **Security** | auth, token, xss, csrf, owasp | `security-auditor` |
| **Debug** | error, bug, crash, not working | `debugger` |
| **Performance** | slow, optimize, cache, bundle | `performance-optimizer` |
| **SEO** | seo, meta, sitemap, structured data | `seo-specialist` |
| **Planning** | plan, architecture, feature spec | `project-planner` |

## Complexity Guide

| Level | Criteria | Action |
| ----- | -------- | ------ |
| **Simple** | 1 domain, 1-2 files | Auto-invoke agent |
| **Moderate** | 2 domains, 2-5 files | Auto-invoke relevant agents |
| **Complex** | 3+ domains or unclear | Use `orchestrator`, ask questions first |

## Rules

1. **Silent Analysis** — Don't announce "I'm analyzing…", just state the agent selection
2. **Respect Overrides** — If user mentions `@agent`, use that agent
3. **Don't bypass Socratic Gate** — If task is unclear, ask first, then route
4. **Priority**: GEMINI.md rules > intelligent-routing defaults
