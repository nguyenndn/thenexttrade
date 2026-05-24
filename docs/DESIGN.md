# Design

Last reviewed: 2026-05-24

Design direction: premium, calm, operational, and fast to scan. Dashboard pages should feel like tools, not landing pages.

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

Do not show raw sentinel values like `999` for profit factor.

## Empty States

Empty states should explain the next action.

Good:

- "No trades yet. Log your first trade or connect TNT Connect."
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
