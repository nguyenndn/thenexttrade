---
name: competitor-analysis
description: "Analyze one competitor's organic footprint, ranking keywords, content themes, backlinks, and gaps."
---

# OpenSEO Competitor Analysis

## Goal

Analyze one competitor deeply enough to decide what to learn from, avoid, counter-position against, or outrank.

Use this for a named competitor. For identifying the market leaders first, use `competitive-landscape`.

## Required inputs

- `projectId`
- Competitor domain
- User's domain when comparison is requested
- Optional topic/category/location/language

## Project context

The project-context tools are free and shared with the app and other agents.

1. Call `get_project_context` first and ground the analysis in it — the saved competitors say whether this domain is already known and what was concluded about it before.
2. This skill needs competitors. If none are saved, run a minimal inline setup: save the competitor being analyzed, and ask the user (or infer from `find_serp_competitors` and confirm) whether there are others, write them back with `update_project_context` (`addCompetitors`), then continue the analysis. Never front-load the full interview; suggest `seo-project-setup` at the end for the rest.
3. Before spending credits, check the research log. If the same research ran within the last 30 days, reuse that result and say so instead of re-buying it.
4. On finish, write back what is durable with `update_project_context` — an `addCompetitors` upsert for this domain with a short note on its strengths and where it is vulnerable — and append a research log entry: `{ appendResearchLog: { summary: "Competitor analysis: <domain>. Verdict: <conclusion>" } }`.

## OpenSEO MCP tools

- `get_domain_overview`: baseline organic traffic and keyword count.
- `get_search_console_performance`: when comparing to the user's own domain and Search Console is connected, use it as the first-party baseline (real clicks/impressions/CTR/position) instead of estimating the user's own performance from third-party data.
- `get_ranked_keywords`: exact keyword, URL, rank, intent, traffic, CPC, and SERP-type rows for the competitor domain or page.
- `get_backlinks_overview`: backlink/referring-domain profile.
- `find_serp_competitors`: validate whether the named competitor actually shares search visibility in target niches.
