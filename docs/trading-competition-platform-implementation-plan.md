# Trading Competition Platform Decision Record

## Status

Cancelled for now. Do not implement this feature in the current product roadmap.

## Decision

TheNextTrade should not build a full professional trading competition platform yet.

The original idea was to create a TradeZolo-style competition system with verified live accounts, rankings, prizes, rule enforcement, and admin operations. After reviewing broker/API feasibility, this is not practical for the current system because broker data access is inconsistent:

- Exness appears to provide a Partnership API that may support IB verification and partner reporting.
- VT Markets does not currently provide the same usable partner/client trading API for our needs.
- Vantage does not currently provide the same usable partner/client trading API for our needs.

Because TheNextTrade users may trade through different brokers, building a professional competition layer on top of only one broker API would create an incomplete product.

## Why We Are Not Building It

### 1. Broker Coverage Is Not Reliable Enough

A serious competition needs trusted data across all supported brokers:

- account ownership
- account under the correct IB
- starting balance/equity
- order history
- deposits/withdrawals
- open and closed positions
- drawdown
- profit
- lot size
- rule violations

If only Exness supports the required API but VT Markets and Vantage do not, the system would either exclude many users or rely on manual/self-reported data.

That is not strong enough for a professional competition.

### 2. Anti-Cheat Would Be Weak

Without consistent broker-side APIs, we cannot fully verify:

- whether the user owns the account
- whether the account was changed mid-competition
- whether deposits/withdrawals happened during the competition
- whether trades were removed or imported selectively
- whether the starting balance is accurate
- whether all trades were synced

TNT Connect and EA Sync are useful for user analytics, but they are not enough by themselves to run a money/prize competition with strong fairness guarantees.

### 3. Admin Operations Would Become Too Heavy

The admin team would need to manually investigate:

- mismatched account data
- missing sync data
- disputed ranks
- broker-specific edge cases
- fake or incomplete accounts
- prize eligibility

This creates high operational load before the product has a stable competition foundation.

### 4. The Product Would Feel Incomplete

If the feature only works well for Exness but not other brokers, users will feel the system is unfinished.

This is worse than not launching the feature at all.

## What We Should Do Instead

### Keep Existing Leaderboard

Keep `/dashboard/leaderboard` as a community/progress leaderboard, not a professional trading competition.

It can rank users by:

- Edge points
- streak
- academy progress
- missions
- public trader card activity
- recent trading consistency

This does not require broker-grade verification.

### Build Broker Verification Separately

If we integrate Exness API, use it for a smaller and cleaner scope:

- verify whether an account belongs under our IB
- auto-check Partner Pro eligibility
- support admin IB reporting
- reduce manual review for Exness users

Do not position this as a competition engine.

### Keep Competition As Future Research

Only reopen this feature if at least one of these becomes true:

- all target brokers provide reliable APIs for account/order history
- TheNextTrade limits competitions to one verified broker only
- we partner directly with a broker that provides official competition infrastructure
- we accept a non-prize, non-professional "community challenge" format with lighter verification

## Future Alternative: Community Challenge

If we still want a lighter version later, build a "Community Challenge" instead of a professional competition.

This would be lower risk and should avoid prize-money positioning.

Possible examples:

- 7-day consistency challenge
- no overtrading challenge
- journal streak challenge
- risk discipline challenge
- academy completion challenge
- weekly review completion challenge

These challenges can use internal product behavior rather than broker-verified trading results.

## Do Not Build These For Now

Do not create:

- competition database models
- competition registration flow
- prize/payout workflow
- broker-verified ranking engine
- anti-cheat competition engine
- public tournament pages
- admin competition console

## Recommended Current Roadmap

Focus on features that are already aligned with the current system:

1. New user activation.
2. Trade sync reliability.
3. Weekly review and coach action plans.
4. Personalized learning path from trade data.
5. Public Trader Card 2.0.
6. IB verification for brokers that expose usable partner APIs.

## Final Note

The competition idea is attractive, but not yet feasible enough to build well.

For now, TheNextTrade should avoid launching a half-complete broker-dependent competition platform.
