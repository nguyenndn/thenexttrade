# Academy — 12-Level Trading Curriculum

## Overview
The Academy is a comprehensive LMS (Learning Management System) with a 12-level curriculum designed to take traders from beginner to funded professional.

## Access
- **Public:** `/academy` — Free lessons visible to all visitors (SEO-indexed)
- **Dashboard:** `/dashboard/academy` — Authenticated view with progress tracking
- **Admin:** `/admin/academy` — Content management + AI rewrite tools

## Curriculum Structure (12 Levels)

| Level | Title | Target | Tone |
|-------|-------|--------|------|
| L1 | Getting Started | Beginner | conversational |
| L2 | Forex Basics | Beginner | edutainment |
| L3 | Protect Your Money | Beginner | conversational |
| L4 | Price Action | Intermediate | mentor |
| L5 | Technical Tools | Intermediate | mentor |
| L6 | Strategy Building | Intermediate | tactical |
| L7 | Trader Mindset | All levels | motivational |
| L8 | Advanced Concepts | Advanced | professional |
| L9 | Trading Systems | Advanced | analytical |
| L10 | Risk Mastery | Advanced | professional |
| L11 | Psychology & Performance | Advanced | motivational |
| L12 | Funded Trader Path | Advanced | tactical |

## Data Model
```
Level (1-12)
├── Module (multiple per level)
│   ├── Lesson (multiple per module)
│   │   ├── title, slug, content (HTML)
│   │   ├── metaDescription (SEO)
│   │   ├── rawContent (original scraped)
│   │   ├── sourceUrls[] (multi-source refs)
│   │   ├── tone (AI writing tone)
│   │   ├── status (draft/published)
│   │   └── duration (minutes)
│   └── Quiz (optional)
└── UserProgress (per user, per lesson)
```

## AI Content Pipeline

### Flow
1. **Admin** pastes source URL in Lesson editor
2. **Search API** (`/api/ai/search`) finds supplementary sources via Serper.dev
3. **Admin** selects tone + optional supplementary URLs
4. **Rewrite API** (`/api/ai/rewrite`) scrapes all sources → Gemini rewrites with:
   - 5-layer copyright protection
   - Selected tone personality
   - Auto-generated title + meta description
5. **Admin** reviews, edits, publishes

### Tones
8 AI writing tones stored in `content/tones/`:
- `conversational` — Friendly beginner chat
- `mentor` — Experienced guide
- `storytelling` — Narrative-driven
- `edutainment` — Fun educational
- `professional` — Formal expert
- `analytical` — Data-focused
- `motivational` — Inspiring mindset
- `tactical` — Actionable strategy

### Copyright Protection
5-layer system defined in `content/rewrite-system-prompt.md`:
1. **Merge** multiple sources (never 1:1 copy)
2. **Structure swap** (different heading order)
3. **Example replacement** (new analogies/examples)
4. **Voice injection** (Captain TheNextTrade persona)
5. **Value-add** (original insights, Vietnamese trader context)

## SEO Features
- `metaDescription` from DB → `generateMetadata()`
- Branded OG images for social sharing
- Twitter card support
- Auto reading time (200 wpm calculation)

## UX Features
- Per-level progress bars on dashboard
- Cross-module prev/next navigation
- "Continue Learning" card with next unfinished lesson
- Click-to-expand lesson list in public view

## Components
| Component | Path | Purpose |
|-----------|------|---------|
| `PublicLessonView` | `src/components/academy/` | Public lesson reader |
| `LessonView` | `src/components/dashboard/academy/` | Dashboard lesson reader |
| `LessonEditForm` | `src/components/admin/academy/` | Admin editor |
| `AIRewriteDialog` | `src/components/admin/academy/` | AI rewrite modal |
| `ContentSourceCard` | `src/components/admin/academy/` | Source preview card |

---
*Last Updated: 2026-04-03*
