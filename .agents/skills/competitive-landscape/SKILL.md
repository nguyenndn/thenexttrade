---
name: competitive-landscape
description: Map SEO market leaders, winning content themes, keyword coverage, backlinks, and strategic gaps.
---

# OpenSEO Competitive Landscape

## Goal

Answer: "Who is winning this SEO market, what content is working for them, and where are the openings?"

Use this when the user wants a market-level view across several competitors. For a deep dive on one domain, use `competitor-analysis`.

## Required inputs

- `projectId`
- Topic, seed keywords, market/category, or user's domain
- Optional known competitors
- Optional location/language

## Project context

The project-context tools are free and shared with the app and other agents.

1. Call `get_project_context` first and ground the market read in it — the saved competitors are the starting roster, and the business and positioning decide who counts as a competitor.
2. This skill needs competitors. If none are saved, run a minimal inline setup: ask the user who they compete with, or infer a shortlist from `find_serp_competitors` and the site and confirm it, write it back with `update_project_context` (`addCompetitors`), then continue the landscape work. Never front-load the full interview; suggest `seo-project-setup` at the end for the rest.
3. Before spending credits, check the research log. If the same research ran within the last 30 days, reuse that result and say so instead of re-buying it.
4. On finish, write back what is durable with `update_project_context` — every confirmed competitor via `addCompetitors` with a short note on why they matter.

## OpenSEO MCP tools

- `research_keywords`: discover representative market queries.
- `get_keyword_metrics`: validate known query sets with volume, difficulty, intent, and trends.
- `get_serp`: identify recurring ranking domains across target queries.
- `find_serp_competitors`: compare domains competing across supplied keywords.
- `get_domain_overview`: size organic footprint for candidate leaders.
- `get_search_console_performance`: anchor current performance from Search Console.
