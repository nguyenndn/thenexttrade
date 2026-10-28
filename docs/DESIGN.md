# Design

Last reviewed: 2026-10-28

Design direction: premium, calm, operational, and fast to scan. Dashboard pages should feel like tools, not landing pages. For full component rules, also reference `design/ui-guide.md` and `AGENTS.md`.

## UI & UX Invariants (Mandatory Design System Rules)

| Rule | Standard |
| --- | --- |
| **Language** | English-only in all user-facing and admin UI copy |
| **Buttons & Dropdowns** | Always use `<Button>` from `@/components/ui/Button` and `<DropdownMenu>` (never raw `<button>` or `<select>`) |
| **Optical Border Radius** | Cards/Panels = `rounded-xl` (12px+); Buttons/Inputs = `rounded-lg` (8px) |
| **Cancel / Close Button** | Always use `variant="outline"` (never `variant="ghost"`) |
| **Icons** | `lucide-react` icons only (never emojis in operational UI) |
| **Input Placeholders** | No generic example placeholders (`e.g. 200`, `Enter...`); rely on clear Labels & Helper Text |
| **Entity Color Picker** | Embed a compact prefix popover swatch `[🟢▾]` inside the Name input instead of sprawling multi-row color grids |
| **2x2 Matrix Specs Card** | Group technical specs (`Account #`, `Broker`, `Server`, `Platform`) into a `grid-cols-2 divide-x divide-y` matrix card |
| **Telemetry Status** | Use a pulsing status dot + relative time (`formatDistanceToNow`) with tooltip instead of rigid `Live (EA)` text badges |

## Feature Density

The product now has many surfaces: journal, Academy, tools, brokers, community, trading systems, reports, AI, rules, missions, and admin ops. The design rule is to show the right surface at the right time, not every surface at once.

- Public homepage: one primary CTA, proof, then clear paths. Do not stack several CTA blocks with the same purpose.
- New user dashboard: setup and first-data actions only.
- Active trader dashboard: current trading state and one next action.
- Admin pages: action queues and support context before decorative charts.
- Trading-system pages: product function, access path, setup guidance, and risk copy. Avoid backtest-style mockups unless validated.

## Layout

- Dashboard content needs consistent padding and breathing room.
- Avoid page content touching the top edge when conditional hero/onboarding blocks are hidden.
- Use compact operational headers inside dashboard/admin pages.
- Do not use oversized marketing hero sections inside authenticated tools.

## Cards

Use cards for repeated list items, data panels, modals, account cards, and tool panels.

Baseline:

- White/light surface in light mode.
- Dark surface only in dark mode.
- Restrained border and shadow.
- Radius around 8-12px unless an existing component already defines it.
- Avoid cards inside cards unless the inner card is a repeated item.

## Buttons And Chips

- Use Lucide icons for recognizable actions.
- Keep button heights consistent within one row.
- Use black/dark text for secondary button labels in light mode.
- Do not duplicate status chips that mean the same thing.
- Use clear disabled states.
- Use tooltips for compact `?` info icons.

Account-card footer:

- Row 1: sync method chip, full width if needed.
- Row 2: access/status chip and actions.
- `PRO` implies EA access.
- Avoid showing both `Not Supported` and `Not eligible` for the same account.

## Text And Color

| Element | Light | Dark |
| --- | --- | --- |
| Heading | `text-gray-900` | `dark:text-white` |
| Body | `text-gray-700` | `dark:text-gray-300` |
| Secondary | `text-gray-500` | `dark:text-gray-400` |
| Positive P/L | emerald/primary | emerald light |
| Negative P/L | red | red light |

Avoid low-contrast gray for important labels.

## Metrics

Metrics that can confuse users need tooltip explanations:

- Win Rate
- Trade Score
- Profit Factor
- Average Win
- Average Loss

### KPI Tooltip Pattern

Component: `src/components/metrics/MetricHelp.tsx`
Definitions: `src/lib/metrics/metric-definitions.ts`

Behavior:

- Desktop: tooltip on hover with 250ms delay.
- Mobile: popover/dialog on tap.
- Must have `aria-label` for accessibility.
- Must not shift layout (use absolute/portal positioning).
- Tooltip content: short description, formula, included data, edge cases, and optional "good to know".

Usage:

```tsx
<MetricHelp metricId="winRate" />
<MetricHelp metricId="profitFactor" side="right" />
```

Do not show raw sentinel values like `999` for profit factor. Use `∞` for infinite and `--` for unavailable.

## Empty States

Empty states should explain the next action.

Good:

- "No trades yet. Log your first trade or set up Trade Manager EA sync."
- CTA to the relevant page/action.

Bad:

- "No data."
- Large empty whitespace with no next step.

## Auth Pages

Login/register direction:

- Premium, modern, light-mode friendly.
- Gold accent for primary auth CTA.
- Signup uses steps to reduce perceived length.
- Country selector shows flag and country name.
- Right-side proof/stat blocks must match light mode.
- "Build Your Trading Edge" should stay inline on desktop when space allows.

## Backgrounds

Subtle backgrounds are allowed:

- Light gradients.
- Fine grid texture.
- Soft premium surface treatment.

Avoid decorative blobs/orbs and one-note color palettes.

## Brand Boundaries

- TheNextTrade is the platform identity and should stay in global navigation/header.
- GoldScalperNinja is the community and MT5-system ecosystem. Use it on `/community`, trading-system cards/details, and EA-specific copy.
- Do not mix both brands in the same heading unless the copy explains the relationship, for example: `GoldScalperNinja ecosystem, powered by TheNextTrade`.

## Onboarding Wizard Pattern

Onboarding at `/onboarding` uses a 4-step card wizard:

- Progress bar at top (gradient, animated).
- Step dots showing current/completed/upcoming.
- Skip button always visible.
- Each step is a distinct card section within the same container.
- Step navigation: Continue button (primary), Back button (outline), Skip (text link).
- Style: matches auth page gold-accented, mobile-first design.
- Container: `max-w-lg`, `rounded-2xl`, `shadow-xl`.
- The wizard persists progress in `User.settings.onboarding`.
