---
name: seo-project-setup
description: Populate a project's shared OpenSEO context — site scope, goals, positioning, competitors, key pages, and preferences — plus MCP checks and Search Console intake.
---

# OpenSEO SEO Project Setup

## Goal

Interview the user once about one website or SEO project, and store the answers in that project's shared context in OpenSEO with `update_project_context`. That context is read by every other skill, by SAM in the app, and by the user on the project's Context settings page — so it survives new sessions, new machines, and new agents. This is a context setup workflow, not a full audit.

## Tone

Be friendly, practical, and structured. Ask questions in small batches. Explain why each item matters only when useful. Do not overwhelm a beginner with jargon.

## Where the answers go

Two project-context MCP tools do all the writing. Both are free — they spend no credits.

- `get_project_context(projectId)`: everything already known about the project, plus a `missingSections` list.
- `update_project_context(projectId, updates)`: a list of patch ops. The ones this skill uses:
  - `{ section: "business_overview" | "current_goal" | "positioning" | "writing_preferences", content }`
  - `{ addCompetitors: [{ domain, name?, notes? }] }`
  - `{ addKeyPages: [{ url, role: "hub" | "spoke" | "money" | "other", topic?, notes? }] }`
  - `{ customSection: "<slug>", title?, content }` for anything that does not fit a typed section
  - `{ appendResearchLog: { summary } }` when this session spends credits

Write in batches as the interview progresses — do not hold every answer until the end. Sections are prose (~4,000 characters each), so a few tight paragraphs, not a transcript.

## Checklist

### 1. Verify OpenSEO MCP and resolve the project

Writes need a `projectId`, so do this first:

1. Use `whoami` if available.
2. Use `list_projects` to confirm the user can access projects.
3. Match the project to the website/domain they want to rank for.
4. If the project list is ambiguous, ask the user which project should be used.
5. If no project matches, offer to create one with `create_project`.
6. If the MCP is unavailable, tell the user to connect OpenSEO MCP; without it, nothing can be saved.

Do not run research tools just to test connectivity; `whoami` and `list_projects` are enough.

### 2. Read what is already there

Call `get_project_context`. Show the user a short summary of what OpenSEO already knows and what is missing. Confirm or correct existing entries rather than re-asking questions that are already answered — this skill is often re-run after another skill filled in part of the context.

### 3. Collect website scope

Ask for:

- Primary website/domain
- Additional domains or subdomains
- Important products, services, categories, or pages
- Target countries/languages
- Whether the site is new, established, migrating, or recovering from a drop
- CMS or publishing workflow, if relevant

Write the durable parts to `business_overview`: what the business does, who it is for, the target markets/locales, and the site's current stage.

### 4. Capture goals

Ask the user what they want from SEO:

- More qualified leads
- More signups/trials
- More ecommerce revenue
- More newsletter/audience growth
- More brand/category awareness
- Recovery from traffic loss
- Better ranking for specific pages

Ask for success metrics and timeframe. If goals are vague, help turn them into measurable goals such as "increase non-branded organic signups" or "rank top 10 for 20 buying-intent terms."

Write the result to `current_goal`, including the metric and timeframe.

### 5. Capture positioning and strategy context

Ask what research they have already done about the company, product, audience, and competitors. Request any notes, docs, customer interviews, positioning docs, pitch decks, landing pages, or strategy memos they can share.

Probe for:

- Who the product or site is for
- What pain it solves
- Why users choose it over alternatives
- Who the main alternatives or competitors are
- Writing tone and brand guidelines

Write findings to `positioning` and `writing_preferences`.
