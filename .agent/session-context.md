# Session Context — GSN-CRM / TheNextTrade

> Auto-generated. Dùng file này để resume context giữa các phiên Antigravity.

## Last Updated: 2026-04-02 (Session 2)

---

## ✅ Completed (All Sessions)

### Session 1 (2026-04-02)
- Partners.json audit (92% accurate, FTMO + The5ers updates identified)
- Content Pipeline Strategy → chốt **Option C: Hybrid Smart**
- Session persistence file created

### Session 2 (2026-04-02)
- **AI Content Rewriter upgraded to Option C Pipeline:**
  - Schema: +rawContent, +tone, +sourceUrls on Lesson model
  - Search API: `/api/ai/search` — Serper.dev (Google/Reddit/X)
  - Rewrite API: Multi-source scraping, tone loading, 5-layer copyright prompt
  - UI: Tone selector (8 tones), auto-search supplements, copyright badge
  - Lesson pages: Create + Edit now save rawContent, tone, sourceUrls
  - System prompt: `content/rewrite-system-prompt.md` (master Gemini prompt)

---

## 📋 Pending Actions

1. **Restart dev server** → run `npx prisma generate` (EPERM file lock)
2. **Add `SERPER_API_KEY`** to `.env.local` — get free key at serper.dev
3. **Test end-to-end** — paste URL, search, select sources, choose tone, generate
4. **Apply partners.json updates** (FTMO + The5ers from audit)

---

## 🏗️ Architecture Notes

### Content Pipeline Files
```
content/
├── rewrite-system-prompt.md   ← Master Gemini prompt (5-layer copyright)
├── writer-persona.md          ← Captain TheNextTrade persona
└── tones/
    ├── conversational.md      ← Beginner (L1-3)
    ├── mentor.md              ← Intermediate (L4-6)
    ├── storytelling.md        ← All levels
    ├── edutainment.md         ← Beginner (L1-3)
    ├── professional.md        ← Advanced (L7-9)
    ├── analytical.md          ← Advanced (L7-9)
    ├── motivational.md        ← Mindset (L10-11)
    └── tactical.md            ← Strategy/Systems
```

### API Endpoints
- `POST /api/ai/search` — Serper.dev auto-search (topic → Google/Reddit/X results)
- `POST /api/ai/rewrite` — Multi-source scrape → Gemini rewrite with tone + copyright

### Key Decisions
- **Search API**: Serper.dev (2,500 free queries)
- **AI Model**: Gemini 2.5 Flash Preview
- **Copyright**: 5-layer protection (merge, structure swap, example replace, voice, value-add)
- **Tone default**: conversational

---

## 🔑 Environment Variables Needed
```
GEMINI_API_KEY=xxx        # Already configured
FIRECRAWL_API_KEY=xxx     # Already configured
SERPER_API_KEY=xxx        # NEW — serper.dev free key
```
