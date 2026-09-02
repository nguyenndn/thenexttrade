---
name: keyword-clustering
description: Cluster keywords by intent and map them to existing or proposed pages.
---

# OpenSEO Keyword Clustering

## Goal

Group keywords into page-level clusters and decide which existing or new page should target each cluster. This is a keyword mapping workflow, not just a semantic grouping exercise.

## Required inputs

- `projectId`
- A keyword list, saved keyword tag, seed topic, or target domain
- Optional existing URLs/pages to map against

If keywords are not provided, use `list_saved_keywords` for saved sets, `research_keywords` for seed discovery, or `get_ranked_keywords` when the user starts from a target domain.

## Project context

The project-context tools are free and shared with the app and other agents.

1. Call `get_project_context` first and ground the mapping in it — the saved key pages are the existing pages clusters should map to, and the business and goal decide which clusters are worth targeting.
2. This skill needs key pages. If none are saved, run a minimal inline setup: ask the user for the pages that matter, or propose a shortlist from the site, an audit, or Search Console and confirm it, write it back with `update_project_context` (`addKeyPages`), then continue the clustering. Never front-load the full interview; suggest `seo-project-setup` at the end for the rest.
3. Before spending credits, check the research log. If the same research ran within the last 30 days, reuse that result and say so instead of re-buying it.
4. On finish, write back what is durable with `update_project_context` — new or corrected `addKeyPages` entries with the topic each page now targets — and append a research log entry: `{ appendResearchLog: { summary: "Keyword clustering: <keyword set>. Verdict: <conclusion>" } }`.

## OpenSEO MCP tools

- `list_saved_keywords`: fetch an existing keyword set, optionally filtered by tags.
- `research_keywords`: expand a seed when the user starts from a topic.
- `get_ranked_keywords`: gather exact ranking keywords and URLs when the user starts from a domain or page.
- `get_search_console_performance`: pull ranking queries from Google Search Console.
