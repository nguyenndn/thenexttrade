---
name: link-prospecting
description: Find link prospects, discover contact paths, and draft outreach from SERPs and backlink signals.
---

# OpenSEO Link Prospecting

## Goal

Find realistic pages, sites, and authors that might reference the user's page, product, study, guide, or tool. Use OpenSEO for prospect discovery, then use available web/search/browser tools for contact discovery.

## Required inputs

- `projectId`
- User domain or target URL
- Linkable asset, page, product, study, tool, or topic
- Optional competitors
- Optional market/location/language

## Project context

The project-context tools are free and shared with the app and other agents.

1. Call `get_project_context` first and ground the outreach in it — positioning supplies the claim that makes a link worth giving, and the saved competitors are the backlink profiles to mine.
2. This skill needs `positioning` and competitors. If either is empty, run a minimal inline setup: ask the user why someone would cite them and who they compete with, or infer from the site and `find_serp_competitors` and confirm, write it back with `update_project_context` (`addCompetitors`), then continue the prospecting. Never front-load the full interview; suggest `seo-project-setup` at the end for the rest.
3. Before spending credits, check the research log. If the same research ran within the last 30 days, reuse that result and say so instead of re-buying it.
4. On finish, write back what is durable — the linkable asset via `addKeyPages`, any competitor whose backlink profile proved useful via `addCompetitors` — and append a research log entry: `{ appendResearchLog: { summary: "Link prospecting: <asset/target page>. Verdict: <conclusion>" } }`.

## OpenSEO MCP tools

- `get_serp_results`: find ranking articles, listicles, resource pages, comparisons, and topical publishers.
- `get_backlinks_overview`: inspect competitor domain or page backlink/referring-domain patterns.
- `get_domain_overview`: qualify important prospect domains.
- `get_ranked_keywords`: understand what a prospect or competitor ranks for when topical fit matters.
- `research_keywords`: expand prospecting queries.
