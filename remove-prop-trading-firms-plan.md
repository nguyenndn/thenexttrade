# Remove Prop Trading Firms And Funded Challenge

## Goal
Remove Prop Trading Firms from the homepage/public broker discovery flow and remove the dashboard Funded Challenge feature entirely. TheNextTrade should stay focused on trade journal, MT5 sync, brokers, crypto exchanges, VPS, tools, education, reports, and coach-driven improvement.

## Current Findings
- `src/components/home/BrokerRankingsSection.tsx` still shows a `Prop Trading Firms` tab.
- `BrokerRankingsSection.tsx` still reads `partnersData.propFirms`.
- `BrokerRankingsSection.tsx` copy still says `funded prop firms`.
- `src/config/partners.json` still contains the full `propFirms` data block.
- `/brokers` is already mostly clean: `src/app/brokers/BrokersClient.tsx` only defines `brokers`, `cryptoExchanges`, and `vps` tabs.
- There are separate funded/prop references outside this homepage/broker UI that should now be removed or rewritten:
  - `src/app/dashboard/funded-challenge/page.tsx`
  - `src/config/navigation.ts`
  - `src/components/dashboard/ProBenefitsModal.tsx`
  - `src/components/home/ReviewsSection.tsx`
  - `src/config/tools-data.ts`
  - `src/app/api/feature-flags/route.ts` example comment references `feature_funded_challenge`.

## Scope
Remove from public discovery:
- Homepage broker ranking section.
- Broker-related partner config if no longer used.
- Public-facing copy that implies TheNextTrade recommends prop firms.

Remove from dashboard:
- `/dashboard/funded-challenge`
- Desktop dashboard navigation item.
- Mobile dashboard navigation item.
- `feature_funded_challenge` usage.

Do not remove unrelated Copy Trading, IB, Pro, Academy, or broker features.

## Tasks
- [ ] Refactor `src/components/home/BrokerRankingsSection.tsx`
  - Remove `useState`.
  - Remove `activeTab`.
  - Remove `props`.
  - Remove `partnersData.propFirms`.
  - Remove the tab switcher UI.
  - Use only `partnersData.brokers.items`.
  - Change heading copy from `Top-Tier Trading Platforms` to something broker-only, for example `Recommended CFD Brokers`.
  - Change description from `Compare regulated brokers and funded prop firms...` to `Compare regulated brokers by deposit, leverage, regulation, and platform fit.`
  - Change `Full Review` link from `/brokers?tab=${activeTab}` to `/brokers?tab=brokers`.
  - Verify: homepage no longer contains the text `Prop Trading Firms`.

- [ ] Clean `src/config/partners.json`
  - Remove the full top-level `propFirms` object if nothing imports it after the component refactor.
  - Keep `brokers`, `cryptoExchanges`, and `vps`.
  - Verify JSON is still valid after removing the block.
  - Verify: `rg "propFirms|Prop Trading Firms" src/config src/components src/app` returns no public UI usage.

- [ ] Verify `/brokers`
  - Confirm `src/app/brokers/BrokersClient.tsx` still has only these tabs:
    - CFD Brokers
    - Crypto
    - VPS Hosting
  - Confirm `/brokers?tab=propFirms` falls back to default `brokers`.
  - Verify: no broken tab state, no empty page, no console error.

- [ ] Remove dashboard Funded Challenge route
  - Delete `src/app/dashboard/funded-challenge/page.tsx`.
  - If the folder becomes empty, delete `src/app/dashboard/funded-challenge/`.
  - Verify `/dashboard/funded-challenge` no longer resolves as an active dashboard feature. A 404 is acceptable after removal.

- [ ] Remove Funded Challenge from navigation
  - In `src/config/navigation.ts`, remove the desktop dashboard menu item:
    - `name: "Funded Challenge"`
    - `href: "/dashboard/funded-challenge"`
    - `featureFlag: "feature_funded_challenge"`
  - In `src/config/navigation.ts`, remove the mobile `More` item for `Funded Challenge`.
  - Remove `feature_funded_challenge` imports/references if they become unused.
  - Verify dashboard sidebar and mobile bottom `More` menu no longer show Funded Challenge.

- [ ] Clean feature flag references
  - Search for `feature_funded_challenge`.
  - Remove the example from `src/app/api/feature-flags/route.ts` if it is only documentation/comment text.
  - Remove any seeded/default flag config if present elsewhere.
  - Verify: `rg "feature_funded_challenge|funded-challenge" src` returns no active references.

- [ ] Clean public copy references
  - `src/components/home/ReviewsSection.tsx`: replace the review text mentioning `Passed my funded challenge...` with a journal/analytics-focused testimonial.
  - `src/components/dashboard/ProBenefitsModal.tsx`: replace `prop firm prep` with `advanced risk management` or `advanced strategy prep`.
  - `src/config/tools-data.ts`: replace `Most prop firms cap maximum drawdown...` with a neutral professional-risk wording, for example `Many professional risk frameworks cap maximum drawdown at 5-10%.`
  - Verify: public UI does not promote prop firms.

- [ ] Update docs
  - Update `docs/FEATURE_SPECS.md` if it still references broker/prop behavior.
  - Add a short note: homepage and brokers page no longer contain prop firm discovery.
  - Add a short note: `/dashboard/funded-challenge` was removed from the product.
  - Verify docs do not contradict the UI.

## Verification
- [ ] Run `npm run type-check` or the project equivalent.
- [ ] Run `npm run lint` if available.
- [ ] Open `/` and confirm:
  - Broker ranking block has no tab switcher.
  - No `Prop Trading Firms` text.
  - Broker cards render normally.
  - CTA links go to `/brokers?tab=brokers`.
- [ ] Open `/brokers` and confirm only CFD Brokers, Crypto, and VPS Hosting tabs exist.
- [ ] Open `/brokers?tab=propFirms` and confirm it safely falls back to brokers.
- [ ] Open `/dashboard` and confirm Funded Challenge is not in the sidebar.
- [ ] Open dashboard mobile/tablet layout and confirm Funded Challenge is not in the `More` group.
- [ ] Open `/dashboard/funded-challenge` and confirm it is removed/404.
- [ ] Search source:
  - `rg "propFirms|Prop Trading Firms|funded prop firms|feature_funded_challenge|funded-challenge|Funded Challenge" src`
  - Expected: no active product references remain.

## Done When
- [ ] Homepage no longer shows or references Prop Trading Firms.
- [ ] `/brokers` no longer exposes any prop firm tab or prop firm route state.
- [ ] No code imports `partnersData.propFirms`.
- [ ] Public copy no longer positions TheNextTrade as a prop firm recommendation site.
- [ ] `/dashboard/funded-challenge` is removed.
- [ ] Dashboard desktop and mobile navigation no longer include Funded Challenge.
- [ ] `feature_funded_challenge` is no longer used.
