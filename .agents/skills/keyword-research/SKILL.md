---
name: keyword-research
description: Discover keyword opportunities, evaluate metrics and SERPs, and save/tag promising terms.
---

# OpenSEO Keyword Research

## Goal

Turn seed topics into a prioritized keyword opportunity set using OpenSEO MCP data. The output should help the user decide what to target, what to save, and what to research next.

## Required inputs

- `projectId`
- One or more seed topics, products, pages, competitors, or audience problems
- Optional market/location/language

If `projectId` is missing, use `list_projects` first. If the target market/location/language is unclear and would materially affect keyword metrics, ask the user; otherwise use the MCP tool defaults.

## Project context

The project-context tools are free and shared with the app and other agents.

1. Call `get_project_context` first and ground the research in it — the business, the goal, the markets, and the competitors and key pages already saved.
2. This skill needs `business_overview` and `current_goal`. If either is empty, run a minimal inline setup: ask the user, or infer from the site and confirm, just enough to fill them, write them back with `update_project_context`, then continue the research. Never front-load the full interview; suggest `seo-project-setup` at the end for the rest.
3. Before spending credits, check the research log. If the same research ran within the last 30 days, reuse that result and say so instead of re-buying it.
4. On finish, write back what is durable — a sharpened `business_overview` or `current_goal`, competitors that kept appearing in the SERPs via `addCompetitors`, pages the keywords should land on via `addKeyPages` — and append a research log entry: `{ appendResearchLog: { summary: "Keyword research: <seeds/market>. Verdict: <conclusion>" } }`.

## OpenSEO MCP tools

- `research_keywords`: primary discovery tool. Use 1-5 seeds per call and prefer 150 results unless the user asks for exhaustive research.
- `get_keyword_metrics`: hydrate up to 700 known keywords with volume, keyword difficulty (KD), search intent, CPC, and monthly trends in one call. Use it to score candidate or known terms — including the Search Console striking-distance queries.
- `get_ranked_keywords`: pull exact ranking keyword rows when a target domain or page is part of the research brief.
- `get_search_console_performance`: when Search Console is connected, start from the project's real first-party demand — queries already earning impressions and near-ranking ("striking distance") terms.
- `get_serp`: fetch live Google SERPs to understand search intent and competition.
