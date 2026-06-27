# Trading Systems Guide Content Update Plan

## Goal
Update `/trading-systems` and each trading system detail page so the content is based on the real user guides in `docs/systems-pdf`, not generic EA marketing copy.

## Source Documents

| Product | Source file | Content status |
|---|---|---|
| EA GoldScalperNinja | `docs/systems-pdf/GOLDSCALPERNINJA EA V3.0 - USER MANUAL.pdf` | PDF, text extractable with `pypdf`; use as source of truth |
| Trade Manager | `docs/systems-pdf/TRADE_MANAGER_USER_GUIDE.md` | Markdown guide, ready to use |
| GSN Phoenix Grid | `docs/systems-pdf/PHOENIX_GRID_MASTER_SPECIFICATION.md` | Markdown master spec, use with risk disclaimers |

## Product Positioning

### 1. EA GoldScalperNinja

**Page role:** flagship automated MT5 Expert Advisor for XAUUSD traders.

**Core message:**  
EA GoldScalperNinja is a rule-based MT5 automated trading system for Gold that uses D1 Trend Master filtering, dynamic grid execution, Smart Sequence Pruning, daily limits, news filter, safe close, and remote control from MT5 mobile.

**Use these guide-derived points:**
- `Trend Master` reads the Daily D1 candle structure, ATR, and projected control zone.
- The EA classifies market state as Trend Up, Trend Down, or Sideway.
- Auto Trend Master mode controls first-order direction, but old DCA chains continue to be managed.
- Dynamic grid supports Stop, StopLimit, and Virtual Stop entry modes.
- Smart Sequence Pruning uses newer profitable trades to trim the oldest negative trades.
- Daily controls include daily profit target, daily max loss, and close-all options.
- News filter can pause entries before and after high-impact events.
- Safe Close can exit a hostile sequence at a controlled smaller loss.
- Remote control via pending orders allows ON/OFF control from MT5 mobile.

**Do not claim:**
- Guaranteed profit.
- Verified win rate, profit factor, monthly return, or max drawdown unless there is a real public proof link.
- "Zero risk", "safe grid", "no drawdown", or "institutional guaranteed flow".

**Suggested card copy:**
- Badge: `Automated EA`
- Title: `EA GoldScalperNinja`
- One-liner: `Automated MT5 execution for XAUUSD with D1 Trend Master filtering and Smart Sequence Pruning.`
- Bullets:
  - `D1 Trend Master control zone`
  - `Smart Sequence Pruning recovery`
  - `News, daily limit, and safe-close controls`
  - `Remote ON/OFF from MT5 mobile`
- CTA: `Unlock GoldScalperNinja`

**Suggested detail sections:**
- `What it is`: explain automated XAUUSD EA.
- `Trend Master`: explain D1 control zone and direction filtering.
- `Grid & Entry Logic`: Stop, StopLimit, Virtual Stop, grid step, order caps.
- `Smart Sequence Pruning`: explain rolling recovery without overpromising.
- `Risk Controls`: daily target, daily max loss, news filter, safe close.
- `Remote Control`: pending-order based mobile ON/OFF.
- `Setup`: dashboard unlock, download, install to MT5, load preset.
- `Risk note`: automated grid systems can increase exposure and require testing.

### 2. Trade Manager

**Page role:** manual execution assistant for traders who still make the trading decision themselves.

**Core message:**  
Trade Manager is not a full auto trading strategy. It is an MT5 chart panel that helps manual traders execute faster, control lot size, manage SL/TP/BE, scale out with TP1/TP2/TP3, use support/resistance, check multi-timeframe trend context, and optionally manage semi-auto DCA logic.

**Use these guide-derived points:**
- Personal trading assistant on the MT5 chart.
- Four tabs: `TRADE`, `S&R`, `TREND`, `SEMI AUTO`.
- Trade tab includes Lot Size, Zone, BE Offset, Max Risk, SL Loss Display, Entry, SL, TP1/TP2/TP3.
- Buttons include GET BUY/SELL, BUY NOW/SELL NOW, SET PENDING, CLOSE PENDING, BE SET, SYNC TP, SYNC SL, CLEAR SL.
- S&R tab shows auto-detected support and resistance.
- Trend tab includes multi-timeframe matrix across M1, M5, M15, M30, H1, H4, D1.
- Semi Auto tab supports DCA grid parameters, mobile trade adoption, dual-direction grid, virtual trailing TP, state persistence, and broker pip-size detection.
- Demo accounts work immediately; real accounts require license activation.
- WebRequest URLs required for real accounts:
  - `https://raw.githubusercontent.com/`
  - `https://api.github.com/`

**Do not claim:**
- That Trade Manager trades profitably by itself.
- That it replaces strategy or risk discipline.
- That semi-auto DCA is safe for beginners.

**Suggested card copy:**
- Badge: `Manual Control`
- Title: `Trade Manager`
- One-liner: `An MT5 execution panel for faster entries, SL, TP, break-even, partial close, and semi-auto trade management.`
- Bullets:
  - `SL, TP, BE, and partial-close controls`
  - `Multi-timeframe trend dashboard`
  - `Auto S&R and trade context`
  - `Semi-auto DCA with mobile trade adoption`
- CTA: `Unlock Trade Manager`

**Suggested detail sections:**
- `What it is`: manual execution assistant, not a signal tool.
- `TRADE tab`: explain entry, SL, TP1/TP2/TP3, partial close.
- `S&R tab`: explain support/resistance zones.
- `TREND tab`: explain timeframe matrix and indicator context.
- `SEMI AUTO tab`: explain DCA, mobile adoption, virtual trailing TP.
- `Install guide`: download ZIP, copy `.ex5`, optional indicator, WebRequest.
- `Troubleshooting`: orders do not place, panel not visible, copy/paste issues.

### 3. GSN Phoenix Grid

**Page role:** advanced grid/hedge system for experienced XAUUSD users only.

**Core message:**  
GSN Phoenix Grid is an advanced XAUUSD grid system built around Adaptive Survival: Harvesting Phase in sideways markets, Survival Phase in trending markets, Phoenix Profit Bank, hedge protection, recovery DCA, adaptive risk levels, and multi-layer protection.

**Use these guide-derived points:**
- Platform: MT5.
- Target symbol: XAUUSD.
- Recommended timeframe: M1 for indicator calculations.
- Architecture: 5-layer modular architecture.
- Philosophy: Adaptive Survival.
- Phase 1: Harvesting Phase for sideways market oscillations.
- Phase 2: Survival Phase for trending or macro-spike conditions.
- Phoenix Profit Bank harvests Level 3 profits and trims older adverse Level 1/Level 2 positions.
- Hedge Protection locks the losing side and starts isolated Recovery DCA on the winning side.
- Adaptive risk levels: Level 1 Harvesting, Level 2 Caution, Level 3 Survival.
- MLPS:
  - H1 macro trend direction filter.
  - M5 volatility spike filter.
  - Momentum strength and Dow Theory structure filter.
- Panel shows account, signal, trading, hedge, and profit bank states.
- State persistence uses MT5 Global Variables.

**Do not claim:**
- Beginner-safe.
- Low drawdown.
- Backtest results, forecast, simulator result, or monthly return unless proof exists.
- That hedge/grid removes risk.

**Suggested card copy:**
- Badge: `Advanced Grid EA`
- Title: `GSN Phoenix Grid`
- One-liner: `Advanced XAUUSD grid and hedge recovery system for traders who understand exposure, multipliers, and drawdown.`
- Bullets:
  - `Adaptive Survival grid logic`
  - `Phoenix Profit Bank trimming`
  - `Hedge Protection and Recovery DCA`
  - `MLPS trend and volatility filters`
- CTA: `Unlock Phoenix Grid`

**Suggested detail sections:**
- `Who it is for`: experienced users only.
- `Adaptive Survival`: Harvesting Phase vs Survival Phase.
- `Phoenix Profit Bank`: L3 harvesting and L1/L2 trimming.
- `Hedge Protection`: lock losing side and recover with winning-side grid.
- `Risk Levels`: Level 1/2/3 behavior.
- `MLPS`: H1, M5, ADX, Dow Theory filters.
- `Panel controls`: Account, Signal, Trading, Hedge, Profit Bank.
- `Risk note`: grid, hedge, recovery, and martingale-style systems can increase exposure quickly.

## Files To Update

### `src/config/trading-systems-data.ts`

Update this file as the single content source for product detail pages.

- Keep only these 3 products:
  - `goldscalperninja`
  - `trade-manager`
  - `gsn-phoenix-grid`
- Remove fake or unverified public metrics from `metrics` unless there is a real proof URL.
- Rewrite `description`, `longDescription`, `bullets`, `functions`, `logic`, `setupSteps`, `riskControls`, and `faqs` based on the source guide mapping above.
- Change `Trade Manager` platform from `BOTH` to `MT5` unless there is a real MT4 version.
- For `Trade Manager`, avoid words like `neural` unless the section explains it as a trend matrix/context helper, not signal certainty.
- For `Phoenix Grid`, add explicit risk wording in `riskControls`.

### `src/app/trading-systems/page.tsx`

Update the public landing page so it is focused and conversion-oriented.

Required structure:
1. Hero:
   - Main promise: unlock MT5 execution tools with eligible partner account.
   - Clarify funds remain with broker.
   - Primary CTA: `Check Unlock Eligibility`.
   - Secondary CTA: `Compare Tools`.
2. Product cards:
   - Show exactly 3 cards.
   - Each card should use product-specific content above.
   - Include a real panel image/preview per EA if available.
   - No `Partner Toolkit`.
3. Access path:
   - `Create account -> Submit MT5 account -> Unlock downloads -> Install on MT5`.
4. Risk and eligibility note:
   - These tools support execution and risk workflow.
   - No profit guarantee.
   - Eligible partner account required.

Remove or avoid:
- Backtest/simulator/forecast claims.
- Overlong educational content.
- Repeated "execute, sync, review" blocks that belong to homepage, not this page.

### `src/app/trading-systems/[slug]/page.tsx`

Ensure detail page renders deeper guide content for each system.

Required behavior:
- Unknown slug returns `notFound`.
- Each product page shows:
  - Hero.
  - What it is.
  - Key functions.
  - Setup steps.
  - Risk controls.
  - FAQs.
  - CTA to `/dashboard/accounts` if logged in, or `/auth/signup?next=/dashboard/accounts&source=trading_systems` if not.
- Add product-specific disclaimers:
  - GoldScalperNinja: automated grid execution risk.
  - Trade Manager: manual decision-making remains user responsibility.
  - Phoenix Grid: advanced grid/hedge exposure risk.

### `src/components/trading-systems/TradingSystemsDetailPanel.tsx`

Update rendering so content can support:
- Product panel screenshot or UI preview image.
- Guide-derived sections without forcing every product into the same generic metric layout.
- Optional `metrics`; if absent, do not render placeholder stats.

### `src/components/home/MT5ExecutionToolkitSection.tsx`

Keep this section short because it is only a homepage teaser.

- Show 3 compact product cards.
- Use the same 3 product names and slugs.
- Do not repeat long detail page content.
- CTA: `View Trading Systems`.
- CTA: `Check Unlock Eligibility`.

### Assets

If real screenshots are available, add them under:

```text
public/images/trading-systems/goldscalperninja-panel.webp
public/images/trading-systems/trade-manager-panel.webp
public/images/trading-systems/phoenix-grid-panel.webp
```

If screenshots are not available yet:
- Use clean product mock panels.
- Do not fake performance or balance numbers.
- Prefer showing real UI fields from the guide: Trend Master, Smart Pruning, TP/SL/BE, Profit Bank, Hedge, Recovery.

## Content Rules

- Use "unlock" instead of "buy" where the product requires eligible partner account access.
- Use "supports execution", "helps manage", "designed for", "provides controls" instead of "makes profit" or "protects account".
- Do not mention performance numbers unless they are verified and linked.
- Do not use "copy trading" copy for these EA pages.
- Do not present Phoenix Grid as beginner-friendly.
- Always say funds remain in the user's broker account.
- Always keep a risk disclaimer visible near CTAs.

## Implementation Tasks

- [ ] Convert/extract GoldScalperNinja PDF content into a dev-readable note if needed.
  - Verify: exact phrases for Trend Master, Smart Sequence Pruning, news filter, safe close, and remote control are visible to the dev.
- [ ] Update `src/config/trading-systems-data.ts` to match the 3 guide-derived product profiles above.
  - Verify: `rg -n "Partner Toolkit|partner-toolkit|forecast|backtest win|monthlyAvg|profitFactor" src/config src/app/trading-systems src/components/trading-systems`.
- [ ] Update `/trading-systems` cards and hero to use the new concise product positioning.
  - Verify: page shows only GoldScalperNinja, Trade Manager, and GSN Phoenix Grid.
- [ ] Update product detail pages to render guide-derived sections and product-specific risk notes.
  - Verify: visit `/trading-systems/goldscalperninja`, `/trading-systems/trade-manager`, `/trading-systems/gsn-phoenix-grid`.
- [ ] Add or wire real panel images/previews for the three products.
  - Verify: no broken images in desktop/mobile.
- [ ] Update homepage MT5 execution teaser so it links cleanly into `/trading-systems`.
  - Verify: homepage teaser does not duplicate the full product page.
- [ ] Run QA.
  - Verify: `npm run type-check`, then Playwright check desktop and mobile for `/trading-systems` and all 3 detail pages.

## Done When

- `/trading-systems` clearly sells the 3 real tools:
  - EA GoldScalperNinja
  - Trade Manager
  - GSN Phoenix Grid
- No Partner Toolkit remains in trading systems UI.
- No fake backtest, forecast, or performance stat remains.
- Each detail page matches the actual guide/document.
- Each product has a clear CTA and risk disclaimer.
- Mobile layout has no text overflow or cramped CTAs.

