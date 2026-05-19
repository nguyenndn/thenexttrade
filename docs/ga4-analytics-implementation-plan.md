# GA4 Analytics Implementation Plan

Date: 2026-05-19

## Goal

Add Google Analytics 4 tracking without slowing down the app, duplicating pageviews, or leaking personal/user trading data.

GA4 is used for traffic, acquisition, funnel, and product-event analysis. The existing internal analytics system remains the source for admin dashboards and server-side reporting.

## Environment Variables

Add these to production/staging only when tracking is desired:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_ANALYTICS_ENABLED="true"
```

Disable GA4 without removing the measurement ID:

```env
NEXT_PUBLIC_ANALYTICS_ENABLED="false"
```

## Implemented Files

### `src/components/analytics/GoogleAnalytics.tsx`

Responsibilities:

- Load GA4 script with `next/script`.
- Use `strategy="afterInteractive"` so GA4 does not block initial render.
- Set `send_page_view: false`.
- Manually send `page_view` on App Router pathname changes.
- Respect `NEXT_PUBLIC_ANALYTICS_ENABLED=false`.

### `src/app/layout.tsx`

Responsibilities:

- Read `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
- Add preconnect only when measurement ID exists.
- Mount `<GoogleAnalytics />` globally.

### `src/lib/track.ts`

Responsibilities:

- Keep existing internal analytics event tracking via `/api/analytics/event`.
- Forward the same client events to GA4 when GA4 is loaded.
- Normalize GA4 event names.
- Sanitize event params.
- Block PII/trading-sensitive keys from GA4.

Blocked keys include:

- `email`
- `account`
- `mt5`
- `telegram`
- `phone`
- `password`
- `fullName`
- `userId`
- `user_id`

## Event Map

### Auth

| Event | Trigger | Safe Params |
| --- | --- | --- |
| `login_submitted` | User submits login form | `method` |
| `login_failed` | Login returns an error | `method` |
| `login_requires_2fa` | Password login requires 2FA | `method` |
| `magic_link_requested` | Magic link request succeeds | none |
| `sign_up_started` | User passes signup step 1 | `country` |
| `sign_up_submitted` | User submits final signup step | `country`, `notify` |
| `sign_up_failed` | Signup returns an error | `country` |
| `sign_up_verification_required` | Signup requires OTP/email verification | `country` |
| `sign_up_completed` | Signup succeeds without verification flow | `country` |

### Existing Product Events Forwarded To GA4

These already use `trackEvent()` and are now forwarded to GA4 automatically:

| Event | Area |
| --- | --- |
| `activation_cta_clicked` | Dashboard activation checklist |
| `empty_state_cta_clicked` | Empty state CTAs |
| `mission_report_cta_clicked` | Missions to reports |
| `weekly_review_generate_clicked` | Report generation |
| `weekly_review_generate_blocked_no_data` | Report generation friction |
| `weekly_review_generate_succeeded` | Report generation success |
| `click_download_ea` | EA download |
| `click_open_account` | Broker/account CTA |
| `submit_account` | Account submission |
| `article_ops_bulk_seo_applied` | Admin content ops |
| `article_ops_bulk_image_prompts_exported` | Admin content ops |

### Missions

| Event | Trigger | Safe Params |
| --- | --- | --- |
| `mission_claimed` | User claims a mission reward | `mission_id`, `category`, `edge`, `surface` |

## Privacy Rules

Never send these to GA4:

- User email
- User name/full name
- Phone number
- Telegram handle
- MT5 account number
- Broker account number
- Password or auth token
- Supabase/User ID
- Trade-level private notes

Prefer safe metadata:

- `country`
- `method`
- `surface`
- `category`
- `mission_id`
- `edge`
- `article_slug`
- `source`
- `plan`

## QA Checklist

### With GA4 disabled or missing measurement ID

- Visit `/auth/signup`.
- Confirm no request to `googletagmanager.com`.
- Confirm no request to `google-analytics.com`.
- Confirm no console errors.

### With GA4 enabled

Set:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_ANALYTICS_ENABLED="true"
```

Then verify:

- GA script loads after interaction.
- One `page_view` is sent per App Router navigation.
- Signup events appear in GA4 DebugView.
- Mission claim event appears in GA4 DebugView.
- Existing `trackEvent()` events still appear in internal `/api/analytics/event`.
- No PII appears in GA4 event params.

## Rollback Plan

Fast rollback:

```env
NEXT_PUBLIC_ANALYTICS_ENABLED="false"
```

Full rollback:

- Remove `<GoogleAnalytics />` from `src/app/layout.tsx`.
- Remove `src/components/analytics/GoogleAnalytics.tsx`.
- Keep internal `trackEvent()` behavior intact.

## Current Status

Implemented and verified:

- ESLint passed for touched files.
- Type-check passed with `npm run type-check`.
- Local smoke test on `/auth/signup` passed with GA disabled/missing measurement ID.
