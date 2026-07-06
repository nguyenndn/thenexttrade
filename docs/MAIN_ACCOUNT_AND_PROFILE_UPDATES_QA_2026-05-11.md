# Main Account Selection & Profile Settings Updates - QA Report (2026-05-11)

**Run timestamp:** 2026-07-04T06:05:05.085Z
**Test file:** `tests/e2e/main-account-profile-qa.spec.ts`

**All checks passed - no confirmed bugs found.**

---

## Test Coverage

### Feature 1: Main Account Selection
- Set as Main via dropdown menu
- MAIN badge rendering (optimistic UI)
- Exclusivity (only one account holds MAIN badge)
- Dashboard navigation redirects to main account

### Feature 2: Widget Unlock Pro Free Context Awareness
- Sidebar widget rendering (Free Plan + CURRENT badge, View Pro benefits link, Unlock Pro Free button)
- CTA link includes sourceAccountId for current account context
- Upgrade modal opens pre-filled with account data

### Feature 3: Telegram ID & Settings UX
- Telegram ID field visible and editable
- Save Changes triggers floating toast notification
- Telegram ID persists after hard refresh

---

## Confirmed Findings

No confirmed bugs found in this pass.

## Visual Evidence

Screenshots: `test-results\main-account-qa`

## Test Command

```
.\node_modules\.bin\dotenv.cmd -e .env -- powershell -NoProfile -Command '$env:TURNSTILE_SECRET_KEY=""; $env:NEXT_PUBLIC_TURNSTILE_SITE_KEY=""; npx playwright test tests/e2e/main-account-profile-qa.spec.ts --project=chromium --reporter=list'
```