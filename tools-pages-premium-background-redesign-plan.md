# Tools Pages Premium Background Redesign Plan

## Goal
Rebuild the visual background and page atmosphere for `/tools` and `/tools/{name}` so these pages feel like the rest of TheNextTrade: premium, Gold-led, clean, trader-focused, and consistent with the homepage.

This is a UI/UX polish task only. Do not change calculator formulas, API behavior, SEO schemas, tool data, or route structure.

## Current Findings
- `/tools` is visually useful but feels generic:
  - Plain white background with limited brand atmosphere.
  - Hero uses teal/cyan gradient while the current homepage direction is Gold-led.
  - Search, tabs, card hover states, and `Open Tool` links use cyan/primary, so the page feels detached from the newer homepage style.
  - Cards are functional, but they float on a flat white page instead of a premium command-center surface.
- Most `/tools/{name}` pages use `src/components/tools/ToolPageLayout.tsx`.
- Two important tool detail routes are custom and must be updated separately:
  - `src/app/tools/market-hours/page.tsx`
  - `src/app/tools/economic-calendar/EconomicCalendarClient.tsx`
- The current detail layout already has a HUD idea, but the background behind it is still too plain and the accent system is inconsistent across tool categories.

## Design Direction
Use the same visual language as the homepage:
- Light premium base, not a heavy dark trading terminal.
- Subtle dotted/grid texture with very low opacity.
- Gold as the primary brand accent.
- Emerald only for live/positive status.
- Tool category colors may remain inside small icons or result states, but page-level UI should be Gold-first.
- No decorative gradient orbs, bokeh blobs, or floating abstract blobs.
- Keep layouts scannable and professional. Tools are utility pages, so the design must support fast use.

## Scope

### 1. Add a Reusable Tools Background Shell
Create a reusable component:

`src/components/tools/ToolsPageShell.tsx`

Responsibilities:
- Wrap public tools pages with a consistent background.
- Include:
  - `min-h-screen flex flex-col bg-slate-50/40 dark:bg-[#0B0E14]`
  - Subtle dotted background similar to homepage:
    - `bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)]`
    - `background-size: 40px 40px`
    - opacity around `0.10-0.16` light mode, `0.14-0.20` dark mode
  - Soft top/bottom section dividers using thin Gold lines, not orbs.
  - `PublicHeader` and `SiteFooter`.
- Accept props:
  - `children`
  - optional `className`
  - optional `mainClassName`
  - optional `maxWidth`, default `max-w-6xl`

Verification:
- `/tools`, `/tools/position-size-calculator`, `/tools/market-hours`, `/tools/economic-calendar` all share the same page atmosphere.
- Header and footer remain unchanged.
- No horizontal overflow on mobile.

### 2. Rebuild `/tools` Hero Background and Header
Update:

`src/app/tools/page.tsx`

Replace the current plain hero with a Gold-led section:
- Use the shared shell from Task 1.
- Hero content:
  - Eyebrow: `Trader's Toolkit`
  - H1: `Professional Trading Tools`
  - Highlight only `Trading Tools` or `Tools` in Gold.
  - Description should stay practical:
    - `{ALL_TOOLS.length} free tools to manage risk, size positions, plan trades, and read market conditions before you execute.`
- Add a compact trust/status row under description:
  - `Free to use`
  - `Risk-first calculators`
  - `Market context tools`
  - `Built for MT5 traders`
- The status row should be small chips, centered on desktop, wrap on mobile.
- Background:
  - Dotted/grid texture from shell should remain visible.
  - Add a subtle Gold underline/accent line below hero, not a large glow.

Verification:
- Hero feels connected to homepage Gold style.
- H1 is readable on mobile and does not wrap awkwardly.
- No cyan/teal dominant gradient in the hero.

### 3. Rebuild Tools Search and Category Tabs as a Command Bar
Update:

`src/components/tools/ToolsGrid.tsx`

Replace the detached search + tabs with one premium command surface:
- Create one rounded container around search + tabs:
  - `rounded-2xl`
  - `border border-gold/20`
  - `bg-white/80 dark:bg-white/[0.03]`
  - subtle shadow
- Search input:
  - Focus ring should use Gold, not cyan.
  - Placeholder remains useful.
  - Add label or microcopy above/beside search: `Find the exact tool for your setup`.
- Tabs:
  - Active state should use solid Gold or Gold-tinted background.
  - Active text should be white if background is solid Gold.
  - Inactive tabs should be quiet.
  - Keep horizontal scroll on mobile.
- Keep the existing tab behavior and search behavior.

Verification:
- Search still filters tools.
- Typing into search still switches to `All`.
- Tabs still switch categories.
- On mobile, tabs scroll horizontally without page overflow.

### 4. Restyle Tool Cards to Match Premium Homepage Cards
Update:

`src/components/tools/ToolsGrid.tsx`

Keep the existing `ToolCard` data and preview mockups, but restyle cards:
- Card:
  - White/translucent card over dotted background.
  - `border-dashboard` or `border-gold/15`.
  - Hover state: `border-gold/35`, slight translate up, shadow.
- Preview area:
  - Keep existing mockups.
  - Place preview in a slightly warmer surface:
    - `bg-gradient-to-br from-white to-gold/[0.035]`
    - Do not add heavy gradients.
- Title row:
  - Tool icon can keep category color, but title hover should be Gold instead of cyan.
- CTA row:
  - Change `Open Tool` to Gold.
  - Arrow movement can stay.

Verification:
- Cards look like part of the same design system as homepage cards.
- Preview mockups still render.
- Tool card click target remains the full card.

### 5. Update `/tools/{name}` Shared Detail Layout
Update:

`src/components/tools/ToolPageLayout.tsx`

Use `ToolsPageShell` and make detail pages feel like a focused tool workspace:
- Replace root `div` + duplicated `PublicHeader/SiteFooter` with shell.
- Keep all existing JSON-LD and view tracking.
- Breadcrumb:
  - Keep same links.
  - Restyle to Gold hover and translucent white card.
- Hero:
  - Keep split content + HUD structure.
  - Convert page-level accent to Gold:
    - badge border/background Gold
    - highlight text Gold
    - HUD border Gold/20
  - Tool icon can still use `tool.iconBg`.
  - Replace generic `Terminal Status` if desired with `Tool Status`.
- Calculator workbench:
  - Wrap calculator children in a stronger premium surface:
    - `bg-white/90 dark:bg-[#151925]/90`
    - `border border-gold/15`
    - shadow
  - Keep calculator internal UI unchanged unless colors clash badly.
- Secondary sections:
  - `How to Use`, `What Is`, `Key Features`, `Similar Tools`, `FAQ` should sit on the same background system.
  - Change blue/primary-heavy accents to Gold/emerald where appropriate.

Verification:
- All calculator pages using `ToolPageLayout` render correctly:
  - `/tools/position-size-calculator`
  - `/tools/pip-value-calculator`
  - `/tools/margin-calculator`
  - `/tools/profit-loss-calculator`
  - `/tools/risk-reward-calculator`
  - `/tools/drawdown-calculator`
  - `/tools/compounding-calculator`
  - `/tools/fibonacci-calculator`
  - `/tools/pivot-point-calculator`
  - `/tools/leverage-calculator`
  - `/tools/risk-of-ruin-calculator`
  - `/tools/currency-converter`
  - `/tools/currency-heat-map`
  - `/tools/correlation-matrix`
  - `/tools/live-market-rates`
- Existing calculator interactions still work.
- SEO schema output remains unchanged.

### 6. Update Custom Tool Detail Pages
Update:

`src/app/tools/market-hours/page.tsx`
`src/app/tools/economic-calendar/EconomicCalendarClient.tsx`

These do not use `ToolPageLayout`, so apply the same background shell manually or refactor them to use a small shared layout helper.

Required changes:
- Use `ToolsPageShell`.
- Keep existing page-specific controls and logic.
- Convert hero/badge/HUD to Gold-led style.
- Keep live status emerald.
- Update toolbar surfaces to match:
  - translucent white/dark panels
  - Gold focus/hover where suitable
  - no cyan active state unless it specifically indicates selected calendar date; if possible, use Gold for selected UI and emerald only for live/positive data.

Verification:
- `/tools/market-hours` renders with the same background as calculator pages.
- `/tools/economic-calendar` renders with the same background.
- Filters, refresh, date selection, and timezone selector continue working.

### 7. Add a Small User-Facing CTA Strip, Not a Salesy Block
Optional but recommended for cohesion.

Add a compact CTA strip below the tool grid on `/tools` and below the calculator result on detail pages:
- `/tools` CTA:
  - Copy: `Want your tools and trade history in one place?`
  - CTA: `Start Free Journal`
  - href: `/auth/signup?source=tools_hub&intent=track`
- `/tools/{name}` CTA:
  - Copy: `Use this result in your trading workflow.`
  - CTA: `Start Free Journal`
  - href: `/auth/signup?source=tool_detail&tool=${tool.slug}`

Constraints:
- Keep compact.
- Do not distract from the calculator itself.
- On mobile, CTA should stack cleanly.

Verification:
- CTA links are correct.
- CTA does not push the calculator below the fold too aggressively.

### 8. Responsive Requirements
Desktop:
- Hero content max width remains readable.
- Search + tabs command bar should not feel too wide or sparse.
- Cards remain `3 columns` where there is enough width.

Tablet:
- Cards can be `2 columns`.
- Hero/HUD can stack if needed.

Mobile:
- Hero title must not overflow.
- Command bar search full width.
- Tabs horizontally scroll inside their own container.
- Tool cards one column.
- Detail calculator panel remains usable without horizontal scroll.

Verification:
- Test at:
  - `1440x1100`
  - `1024x900`
  - `390x900`
- `document.documentElement.scrollWidth <= clientWidth` on all tested mobile pages.

## Files To Touch
- `src/components/tools/ToolsPageShell.tsx` new
- `src/app/tools/page.tsx`
- `src/components/tools/ToolsGrid.tsx`
- `src/components/tools/ToolPageLayout.tsx`
- `src/app/tools/market-hours/page.tsx`
- `src/app/tools/economic-calendar/EconomicCalendarClient.tsx`

Potentially touched if color clashes appear:
- `src/components/tools/SimilarTools.tsx`
- `src/components/tools/FAQAccordion.tsx`
- individual calculator components only if their wrapper/background clashes badly; do not change formulas.

## Do Not Change
- Calculator formulas.
- Tool routes/slugs.
- `ALL_TOOLS` content unless there is a typo.
- JSON-LD schema structure.
- `ToolViewTracker`.
- Economic calendar API or filter logic.
- Market hours logic.

## Acceptance Criteria
- `/tools` visually matches the Gold/premium direction of the homepage.
- `/tools/{name}` detail pages no longer feel like isolated white utility pages.
- Search, tabs, calculator inputs, and custom tool controls still work.
- Background is consistent but restrained: dotted/grid texture + Gold accents, no decorative orbs.
- Mobile has no horizontal overflow.
- Type-check and lint pass.

## QA Checklist For Claude
Run:
- `npm run type-check`
- `npm run lint`

Manual/Playwright pages:
- `/tools`
- `/tools/position-size-calculator`
- `/tools/risk-reward-calculator`
- `/tools/market-hours`
- `/tools/economic-calendar`

Interactions:
- Search `pip` on `/tools`, confirm filtered tools.
- Switch each tab on `/tools`.
- Open a tool card.
- Change inputs on `position-size-calculator`, confirm results update.
- Change date/filter controls on `economic-calendar`.
- Check mobile viewport `390x900` for `/tools` and one detail page.

