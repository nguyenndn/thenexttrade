---
name: appllama-design-bar
description: Benchmark-quality UI & Anti-Slop design discipline adapted from Appllama (appllama-skills) for TheNextTrade (Next.js + Tailwind CSS + Radix UI + Framer Motion). Enforces One-Accent Color Lock, 3-Tier Dark Elevation, Optical Shape Lock, Tabular Numerals, Native-Feeling Controls, Motion Frequency Gate, and a Mechanical Pre-Flight Audit. Use whenever building, redesigning, or polishing any page, modal, drawer, widget, or component.
license: MIT
metadata:
  source: https://github.com/Appllama/appllama-skills
  adapted_for: TheNextTrade (Next.js 15 App Router + Tailwind CSS v4)
  version: 1.3.0-web
---

# Appllama Design Bar & Anti-Slop Skill (TheNextTrade Web Edition)

You are building interfaces that sit next to the highest-craft fintech and trading products in the world. Users judge whether an interface feels "premium product" or "AI template slop" within seconds. This skill defines the non-negotiable craft bar and mechanical pre-flight checks required before any UI task is considered complete.

---

## 1. The Prime Directive: Proven Skeletons, Zero AI Priors

Never invent an ungrounded layout from generic LLM priors when proven product skeletons exist:
1. **Extract the structural grammar**: Information hierarchy, primary CTA placement, control density, spacing rhythm (`4px`/`8px` grid), and progressive disclosure.
2. **Speak in TheNextTrade's voice**: High-precision institutional trading telemetry, capital preservation focus, and calm visual ergonomics for multi-hour screen sessions.

---

## 2. The 9 Anti-Slop Laws (Mandatory Default Bans)

AI-built web apps share recognizable tells that immediately cheapen the UI. Every law below is a **strict default rule**:

### Law 1 · One Accent, Locked (`Gold` for Action, `Emerald/Rose` for Telemetry)
- **Neutrals carry 90% of the screen** (slate/obsidian surfaces, subtle borders, crisp white/gray hierarchy).
- **Primary Brand & Interactive Accent is LOCKED to Gold (`bg-gold` / `#F59E0B` / `amber-500`)**:
  - Primary CTAs, active tab pills, active toggle switches, and focus rings use **Gold**.
  - **Foreground on solid `bg-gold` is ALWAYS `text-white`** (never use dark text like `text-gray-950` on solid `bg-gold` buttons, active tab pills, or badges).
- **Semantic Financial Telemetry is LOCKED to Emerald & Rose**:
  - **Emerald (`#00C888` / `text-primary` / `emerald-500`)**: Winning PnL, achieved profit targets, live EA connection pulse, positive expectancy.
  - **Rose / Red (`red-500` / `rose-500`)**: Losing PnL, stop-loss hits, destructive actions, rule violations.
- ❌ **BANNED**: Random `indigo-500`, `purple-500`, `violet-500`, `blue-500`, or `cyan-500` buttons, empty-state circles, or decorative badges appearing unprompted on a screen.

### Law 2 · 3-Tier Dark Mode Surface Elevation (Zero Accidental Transparency)
Every screen must render with crisp surface separation in both Light and Dark mode:
- **Level 0 — Page Canvas**:
  - Light: `#F5F3EF` / `bg-gray-50`
  - Dark: Deep obsidian gradient (`#090D16` → `#0D1322`)
- **Level 1 — Floating Cards, Modals, Sheets & Drawers**:
  - Light: `bg-white` with `border-dashboard`
  - Dark (Cards/Widgets): `dark:bg-[#1E2028]` with `border-dashboard` (`rgba(255,255,255,0.08)`)
  - Dark (Modals / Drawers / Sheets): **MUST use solid opaque dark surface `dark:bg-[#0D111C]` or `dark:bg-[#151925]`** (NEVER use `dark:bg-[#0F1117]` on overlays/drawers because `globals.css` overrides `#0F1117` to `transparent !important`).
- **Level 2 — Recessed Inner Cells, Inputs & Spec Matrices**:
  - Light: `bg-gray-50/70`
  - Dark: `dark:bg-[#151925]` or `dark:bg-white/[0.02]`

### Law 3 · Shape Lock (Strict Corner-Radius Hierarchy)
Mixed border radii without optical hierarchy make a UI look assembled from mismatched parts. Lock strictly to this scale:
- **Modals, Dialogs & Drawers**: `rounded-2xl` (`16px`)
- **Outer Cards, Widgets & Section Containers**: `rounded-xl` (`12px`)
- **Inner Spec Cards, Buttons, Inputs, Selects & Badges**: `rounded-lg` (`8px`)
- **Toggle Switches, Status Dots & Avatars**: `rounded-full`
- ❌ **BANNED**: `rounded-sm` or `rounded-md` on cards; bubbly `rounded-2xl` on standard buttons/inputs.

### Law 4 · Precision Typography & Tabular Numerals
- **One Display Headline per screen** (`font-heading`, Lexend, `tracking-tight`).
- **Tabular Numerals (`font-mono tabular-nums`) are MANDATORY** on every number that counts, compares, or updates:
  - Prices (`Entry`, `Exit`, `SL`, `TP`), `PnL ($)`, `Win Rate (%)`, `Lot Size`, `R:R Ratio`, `Completion Rate`, and `Timestamps`.
- **Format numbers like a financial product, not a raw database dump**:
  - Always format currency with explicit sign and 2 decimals (`+$1,250.00`, `-$45.20`), percentages with 1 decimal (`71.4%`), and compact axis ticks (`$1.4k`, `$25k`).

### Law 5 · Polished Controls Over Raw Browser Primitives
A single unstyled browser control ruins an entire modal:
- ❌ **NEVER** use raw `<button>`, native `<select>`, or browser-default `<input type="checkbox">`.
- ✅ **Buttons**: Always use `<Button>` from `@/components/ui/Button` (`variant="outline"` for Cancel/Close, never `variant="ghost"`).
- ✅ **Toggle Switches**:
  - When using a `<label>` + `sr-only peer` checkbox, render the **Gold Pill Switch** (`h-5 w-9 rounded-full` with `bg-gold` when active, `bg-gray-200 dark:bg-white/15` when inactive, and `h-4 w-4 rounded-full bg-white shadow-md translate-x-4` thumb).
  - When using `<Button role="switch">`, ALWAYS include `justify-start` (to override `<Button>`'s default `justify-center` so the thumb never overflows the right edge) and `hover:bg-gold` when active.
- ✅ **Color Pickers**: Embed as a compact prefix popover swatch `[🟢 ▾]` inside `PremiumInput`, never a sprawling 30-button grid row.

### Law 6 · Zero Emoji in UI Chrome
- Icons must come exclusively from `lucide-react` with consistent optical sizing (`14px`–`18px`) and stroke width (`1.75`–`2`).
- Never use emoji (`🚀`, `📈`, `⚠️`, `🔥`) in badges, headers, buttons, or empty states.

### Law 7 · One Label Per Intent
- Standardize action phrasing across all modals and pages:
  - Primary save in modals: `Save Changes` or `Save <Entity>`
  - Dismiss modal: `Cancel` (`variant="outline"`)
- Never mix three synonyms for the same action across adjacent screens.

### Law 8 · Full State Cycles (Never Just the Happy Path)
- **Loading**: Shape-matched `<Skeleton />` blocks that mirror the final card dimensions; never flash a full-screen spinner for a partial data fetch.
- **Empty States**: Composed `<EmptyState />` with a neutral/gold-tinted `lucide-react` icon, concise trader-centric explanation, and a single clear CTA.
- **No Layout Shift on Toggle**: Conditional settings or inputs inside modals must preserve container geometry or use smooth height transitions without jumping.

### Law 9 · The Mechanical Slop Pre-Flight Check
Before declaring any UI change complete, audit these counts on the modified surface:
1. **Unjustified accent hues** (Indigo/Purple/Blue outside semantic telemetry): **must be `0`**
2. **Raw HTML `<button>`, `<select>`, or native `<input type="checkbox">`**: **must be `0`**
3. **Toggle switches missing `justify-start` (thumb overflow bug)**: **must be `0`**
4. **Transparent dark-mode modal/drawer backgrounds (`dark:bg-[#0F1117]` on overlays)**: **must be `0`**
5. **Financial numbers missing `font-mono` / `tabular-nums`**: **must be `0`**
6. **Emoji in UI chrome**: **must be `0`**

---

## 3. Motion Laws & The Frequency Gate

Motion is the highest-leverage polish surface and the easiest to overdo. Apply the **Frequency Gate**:

| Interaction Frequency | Examples | Motion Rule |
|---|---|---|
| **100+ times / session** | Tab switching, table row hover, scrolling, filtering | **Instant (`< 150ms`)**. Subtle background highlight on table rows (`hover:bg-gray-50 dark:hover:bg-white/[0.02]`), **NEVER** scale a table row. |
| **10–50 times / session** | Button press, toggle switch, dropdown menu, popover | **Crisp (`150–200ms`)**, strong ease-out (`cubic-bezier(0.23, 1, 0.32, 1)`). `active:scale-95` on buttons; smooth thumb translation (`duration-200`) on switches. |
| **Occasional** | Modal open/close, Sheet drawer slide, collapsible section | **Spring / Ease-Out (`200–250ms`)** using `SPRING_SOFT` / `panelVariants`. Exits must be faster than entrances. |
| **Data & Telemetry** | Equity curve, PnL numbers, journal tables | **Data the trader is reading never moves for decoration.** No infinite pulsing/bouncing on numbers or text; reserve `animate-pulse` strictly for live 2px status dots. |

