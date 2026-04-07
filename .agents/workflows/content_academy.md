---
description: Academy Content Writing Workflow — Tích hợp marketing skills vào pipeline viết bài Academy. Dùng khi viết, review, hoặc optimize lesson content.
---

# /content_academy — Academy Content Writing Workflow

> Tích hợp 6 marketing skills vào pipeline viết content cho TheNextTrade Academy.
> Skills: `copywriting`, `copy-editing`, `content-strategy`, `seo-audit`, `ai-seo`, `marketing-psychology`

---

## Khi nào dùng workflow này?

| Tình huống | Dùng |
|-----------|------|
| Viết bài lesson mới (manual qua chat) | ✅ Full workflow |
| Review bài do AI generate | ✅ Phase 3-5 |
| Cải thiện bài đã publish | ✅ Phase 3-5 |
| Chạy script `generate-content.js` | ⚡ Tự động — skills đã embed vào prompt files |

---

## Phase 1: Pre-Writing — Content Strategy Check

> 📖 Skill: `content-strategy` + `marketing-psychology`

### 1.1 Xác định Context
// turbo
```bash
echo "=== Checking lesson context ==="
```

Trước khi viết, xác định:
- **Level + Module** → Quyết định tone (xem TONE_MAP trong `content-pipeline-master.md`)
- **Target audience** → Beginner (L1-3), Intermediate (L4-6), Advanced (L7-9), Expert (L10-12)
- **Buyer stage mapping:**
  - L1-3 = Awareness ("What is forex?", "How does trading work?")
  - L4-6 = Consideration ("Best strategy for...", "How to choose...")
  - L7-9 = Decision ("Advanced setups", "Professional approach")
  - L10-12 = Implementation ("Step-by-step systems", "Live setups")

### 1.2 Psychology Hooks (chọn 2-3 per bài)

Áp dụng từ `marketing-psychology` skill:

| Hook Type | Khi nào dùng | Ví dụ cho Trading |
|-----------|-------------|-------------------|
| **Loss Aversion** | Mở bài | "You're losing $X every week without a stop loss" |
| **Contrast Effect** | Before/After | Show wrong way → right way |
| **Social Proof** | Credibility | "93% of pros use this method" |
| **Anchoring** | Numbers | Show big number first, then manageable one |
| **Zeigarnik Effect** | Engagement | Open loop → resolve later in lesson |
| **IKEA Effect** | Practice | "Open your chart and try this RIGHT NOW" |
| **Curse of Knowledge** | Simplify | Explain as if reader knows NOTHING |

### 1.3 Content Pillar Check

Ensure lesson fits into Academy's content pillars:
```
Pillar 1: Forex Basics (L1-3) → What, Why, How
Pillar 2: Technical Analysis (L4-6) → Charts, Patterns, Indicators
Pillar 3: Risk & Money Management (L7-8) → Protection, Position Sizing
Pillar 4: Trading Systems (L9-10) → Strategy Building, Backtesting
Pillar 5: Pro Trading (L11-12) → Psychology, Advanced Execution
```

---

## Phase 2: Writing — Apply Copywriting Frameworks

> 📖 Skill: `copywriting` + `marketing-psychology`

### 2.1 Lesson Structure (from copywriting skill)

```
1. HOOK (Above the fold)
   - Surprising fact, question, or relatable pain scenario
   - Must contain primary keyword naturally
   - Apply: Loss Aversion or Contrast Effect

2. PROBLEM/PAIN (Show you understand)
   - "Most beginners do X... and it costs them $Y"
   - Real numbers, real scenarios
   - Apply: Before/After pattern

3. SOLUTION/BENEFITS (The actual teaching)
   - 3-5 key concepts, deep not wide
   - Every concept → concrete trade example
   - Apply: "Show Me The Money" rule
   - Apply: Math It Out technique

4. HOW IT WORKS (Step by step)
   - Scenario Breakdown pattern
   - Comparison tables (at least 1)
   - Apply: IKEA Effect → reader does something

5. OBJECTION HANDLING (Common traps)
   - "What other sites don't tell you..."
   - Apply: Pratfall Effect → admit what's hard

6. FAQ SECTION (3-4 real questions)
   - Google FAQ rich snippet format
   - Real questions people search

7. QUICK RECAP (3-5 bullets)
   - Key takeaways only

8. 🎯 YOUR ACTION STEP (h4 — compact footer)
   - One thing reader can DO in 5 minutes
   - Apply: Activation Energy → make it trivially easy
   - Format: <h4>🎯 Your Action Step</h4> + <p>action</p>

9. 📚 NEXT LESSON (h4 — compact footer)
   - Link to next lesson in curriculum
   - Write directly into HTML:
     <div class="lesson-footer">
     <h4>📚 Next Lesson</h4>
     <p>Continue your journey → <strong>Next Lesson Title</strong></p>
     </div>
```

### 2.2 Copywriting Quality Rules

From `copywriting` skill — applied to educational content:

| Rule | Implementation |
|------|---------------|
| **Clarity > Cleverness** | Simple words. "Use" not "utilize" |
| **Benefits > Features** | "This saves your account" not "This is a formula" |
| **Specificity > Vagueness** | "$20 risk on 0.1 lots" not "small risk" |
| **Customer language** | Write how traders TALK, not how textbooks read |
| **One idea per section** | Each H2 = one concept, fully explained |
| **Rhetorical questions** | "Ever been stopped out by 2 pips? Yeah, me too." |
| **Use analogies** | "Leverage is like a magnifying glass for your money" |

### 2.3 Word Rules (Banned + Preferred)

**BANNED words** (from copywriting + copy-editing skills):
```
❌ utilize, implement, leverage, facilitate, innovative, robust, seamless,
   cutting-edge, delve, paradigm, embark, unleash, revolutionize,
   comprehensive guide, in conclusion, furthermore, it's worth noting,
   at its core, let's explore, in today's landscape, game-changer
```

**PREFERRED words:**
```
✅ use, set up, help, new, strong, smooth, modern, here's the deal,
   look, the thing is, bottom line, and here's why that matters
```

---

## Phase 3: Post-Writing — Seven Sweeps Edit

> 📖 Skill: `copy-editing`

After first draft, run the **Seven Sweeps Framework**:

### Sweep 1: Clarity
- [ ] Every sentence immediately understandable?
- [ ] No jargon without explanation?
- [ ] No sentences trying to do too much?

### Sweep 2: Voice & Tone
- [ ] Consistent "Captain TheNextTrade" voice throughout?
- [ ] No jarring shifts (casual → formal → casual)?
- [ ] Matches level tone (conversational/mentor/analytical/tactical)?

### Sweep 3: So What
- [ ] Every concept answers "why should I care?"
- [ ] Features → Benefits bridge present?
- [ ] No impressive-but-empty statements?

### Sweep 4: Prove It
- [ ] Claims backed by real numbers?
- [ ] Trade examples have lot size, entry, SL, TP, P&L?
- [ ] No unsubstantiated "most traders" claims?

### Sweep 5: Specificity
- [ ] No vague words ("improve", "optimize", "enhance")?
- [ ] Concrete numbers everywhere (not "a lot of pips")?
- [ ] Real 2025-2026 prices used?

### Sweep 6: Heightened Emotion
- [ ] Pain points FELT, not just mentioned?
- [ ] "Before" state vivid enough?
- [ ] Reader can SEE themselves in the scenario?

### Sweep 7: Zero Risk (for CTA/Quick Win)
- [ ] Quick Win is truly doable in 5 minutes?
- [ ] No barriers to trying the action?
- [ ] Clear next lesson link?

---

## Phase 4: SEO Check

> 📖 Skill: `seo-audit` + `ai-seo`

### 4.1 On-Page SEO (seo-audit)

- [ ] **Title** starts with primary keyword
- [ ] **Meta description** 150-155 chars, keyword included, compelling
- [ ] **H2 headings** contain related search terms (1-2 minimum)
- [ ] **Primary keyword** used naturally 3-5 times in body
- [ ] **First paragraph** contains keyword within 100 words
- [ ] **FAQ section** present with real searchable questions
- [ ] **Internal links** to related lessons ("What to Learn Next")

### 4.2 AI Search Optimization (ai-seo)

- [ ] Content has **clear, definitive answers** (good for AI citations)
- [ ] **Structured format** — H2/H3, tables, lists (AI can parse easily)
- [ ] **Comparison tables** present (AI loves structured data)
- [ ] **FAQ format** (H3 question → P answer) matches AI extraction
- [ ] **Brand name** "TheNextTrade" mentioned naturally 1-2 times
- [ ] **No fluff** — concise, factual, "The Coach" is authoritative

---

## Phase 5: Final Quality Gate

### Content Checklist (before save/publish)

```
CONTENT QUALITY
- [ ] 800-1200 words
- [ ] At least 1 comparison table
- [ ] At least 1 "Before/After" or "Wrong/Right" pattern
- [ ] At least 1 concrete trade example with full numbers
- [ ] FAQ section (3-4 questions)
- [ ] Quick Recap (3-5 bullets)

🖼️ ILLUSTRATIONS (MANDATORY)
- [ ] 2-3 custom infographic images per lesson (use generate_image tool)
- [ ] Images must visualize KEY CONCEPTS from the lesson (not decorative)
- [ ] Style: dark theme, trading-focused, professional infographic
- [ ] Wrap in <figure> with <figcaption> describing the image
- [ ] Upload to media library, embed in lesson HTML
- [ ] Examples: comparison charts, process flows, checklists, anatomy diagrams

🎯 LESSON FOOTER (MANDATORY)
- [ ] "🎯 Your Action Step" present (h4) — actionable in 5 min
- [ ] "📚 Next Lesson" present (h4 in div.lesson-footer) — correct next title
- [ ] Run relevant `node prisma/seed-level-XX.js` to sync DB

VOICE & STYLE
- [ ] Sounds like a real trader, not a textbook
- [ ] "You" focused throughout
- [ ] No banned words/patterns
- [ ] Short paragraphs (2-3 sentences max)
- [ ] Mix of sentence lengths

SEO
- [ ] Title = keyword + hook
- [ ] Meta description present
- [ ] H2s with search terms
- [ ] FAQ in correct format
- [ ] Internal linking hints

COPYRIGHT SAFETY
- [ ] No copied sentences from source
- [ ] Different structure than sources
- [ ] Original examples with new numbers
- [ ] "Captain TheNextTrade" voice (not source voice)

⚠️ FILE PRESERVATION (CRITICAL)
- [ ] **.md file MUST BE KEPT** — NEVER delete raw research .md files
- [ ] .md file = raw source content (search + scrape output) — valuable reference
- [ ] .html file = final lesson content — sits ALONGSIDE .md in the same folder
- [ ] After writing HTML, folder should contain BOTH: `lesson-slug.md` + `lesson-slug.html`
```

---

## Quick Reference — Psychology per Level

| Level | Audience | Primary Hooks | Tone |
|-------|----------|--------------|------|
| 1-2 | Complete beginner | Curiosity, Contrast, Simple Analogies | conversational |
| 3-4 | Beginner growing | Loss Aversion, IKEA Effect, Social Proof | mentor |
| 5-6 | Intermediate | Anchoring, Framing, Data Tables | analytical |
| 7-8 | Advancing | Zeigarnik, Commitment & Consistency | motivational/tactical |
| 9-10 | Advanced | Authority, First Principles | professional/tactical |
| 11-12 | Expert | Survivorship Bias, Second-Order Thinking | professional/mentor |

---

## Integration with Auto-Script (`generate-content.js`)

Khi dùng `generate-content.js`, các principles trên đã được embed vào:
- `content/rewrite-system-prompt.md` — Main rules (Psychology Hooks, Copywriting Principles, Copy-editing, SEO, Banned Patterns)
- `content/writer-persona.md` — Voice & style ("Captain TheNextTrade")
- `content/tones/*.md` — Level-specific tone

### Auto-Script Pipeline

```
Serper search → Select top 3 sources → Firecrawl scrape
→ Extract images (filter icons/logo/ads, max 6)
→ Gemini rewrite (system prompt + persona + tone + images list)
→ Replace [IMAGE_N] → <figure><img> with real URLs
→ Clean JSON garbage → Save to DB (draft)
```

### Script chạy:
```bash
node prisma/generate-content.js 1    # Level 1
node prisma/generate-content.js 2    # Level 2
# ...
```

### Files quan trọng

| File | Vai trò | Ai dùng |
|------|---------|---------|
| `content/rewrite-system-prompt.md` | System prompt + marketing skills | Script + Admin UI |
| `content/writer-persona.md` | Persona "Captain TheNextTrade" | Script + Admin UI |
| `content/tones/*.md` | Tone per level | Script + Admin UI |
| `prisma/generate-content.js` | Auto-generate pipeline | Script only |
| `.agents/workflows/content_academy.md` | Workflow hướng dẫn (file này) | Antigravity chat only |

### Nếu muốn upgrade chất lượng bài viết:
1. Sửa `content/rewrite-system-prompt.md` → ảnh hưởng cả script lẫn Admin UI
2. Sửa `content/writer-persona.md` → ảnh hưởng voice/style
3. Sửa `content/tones/*.md` → ảnh hưởng tone per level
