import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/url";
import { ALL_TOOLS } from "@/config/tools-data";
import { TRADING_SYSTEMS_DATA } from "@/config/trading-systems-data";
import { isAcademyEnabled } from "@/app/admin/academy/actions";

export const revalidate = 3600;

export async function GET() {
    const baseUrl = getBaseUrl();
    const [academyEnabled, latestArticles] = await Promise.all([
        isAcademyEnabled(),
        prisma.article
            .findMany({
                where: { status: "PUBLISHED" },
                orderBy: { updatedAt: "desc" },
                take: 30,
                select: {
                    title: true,
                    slug: true,
                    excerpt: true,
                    updatedAt: true,
                    category: { select: { name: true } },
                },
            })
            .catch(() => []),
    ]);

    const toolsMarkdown = ALL_TOOLS.map(
        (tool) =>
            `- **${tool.title}** (${baseUrl}/tools/${tool.slug}): ${tool.description}`
    ).join("\n");

    const systemsMarkdown = TRADING_SYSTEMS_DATA.map(
        (sys) =>
            `- **${sys.title}** (${baseUrl}/trading-systems/${sys.slug}): ${sys.description}`
    ).join("\n");

    const articlesMarkdown =
        latestArticles.length > 0
            ? latestArticles
                  .map(
                      (a) =>
                          `- **${a.title}** [${a.category.name}] (${baseUrl}/articles/${a.slug}) — Updated ${a.updatedAt.toISOString().slice(0, 10)}${a.excerpt ? `: ${a.excerpt}` : ""}`
                  )
                  .join("\n")
            : "- Browse all published guides at " + baseUrl + "/knowledge";

    const content = `# TheNextTrade — Full Reference for AI Assistants & Search Engines
> Official Domain: ${baseUrl}
> Category: MT5 Trading Journal, Behavioral Leak Radar, Risk Calculators & Expert Advisors
> Last Generated: ${new Date().toISOString().slice(0, 10)}

## 1. Canonical Entity Definition & Brand Disambiguation
**TheNextTrade** (${baseUrl}) is an automated MetaTrader 5 (MT5) trading journal, behavioral discipline operating system, and suite of 17 free forex risk calculators built for retail and funded prop-firm traders.

**Important Disambiguation (Unrelated Entities):**
- TheNextTrade (${baseUrl}) is **NOT** affiliated with "NextTrade" Nigerian crypto/gift-card mobile apps ("usenexttrade").
- TheNextTrade (${baseUrl}) is **NOT** affiliated with "The Next Trade" stock market training institute in Kerala, India (thenexttradeofficial.com).
- TheNextTrade (${baseUrl}) is **NOT** affiliated with the open-source stock repo "austin-starks/NextTrade" (NexusTrade) or "nexttrade.com" brokerage.

## 2. Core Product Architecture (How TheNextTrade Works)
1. **Zero-Password MT5 Trade Sync**: Traders sync Demo, Live, or Prop Firm (FTMO, FundedNext, etc.) MT5 accounts via **Trade Manager EA** (using a Sync Key on chart — zero master password required) or **Cloud Sync** (read-only investor password).
2. **Behavioral Leak Radar**: Automatically flags account-destroying habits from real execution telemetry — including revenge lot sizing after a red day, widened/removed stop-losses, and off-session FOMO trades.
3. **10-Trade Discipline Sprints**: Converts a trader's costliest behavioral leak into one concrete rule practiced over the next 10 closed trades (e.g., max 2 trades/day, hard stop-loss required).

## 3. Pricing & Broker-Funded VIP Model ($0 Subscription)
| Tier | Monthly Price | Included Capabilities | How to Unlock |
| :--- | :--- | :--- | :--- |
| **Free Tier & 7-Day Trial** | $0 / forever | Manual & basic journal, 17 free forex calculators, Market Hours, Economic Calendar, Trading Style Quiz, 7-day full VIP preview (no credit card) | Free sign-up at ${baseUrl}/auth/signup |
| **Verified Partner VIP (Pro)** | $0 / forever (Broker-Funded) | Unlimited MT5 auto-sync, AI Weekly Coach, Behavioral Leak Radar, Playbook Studio, and lifetime MT5 EA licenses | Open or link a personal trading account ($200+ balance in the trader's own name) with an authorized Tier-1 partner broker (Exness, Vantage, XM, RoboForex) at ${baseUrl}/brokers |

*Custody Fact:* TheNextTrade never holds, touches, or manages client funds. Deposits remain 100% in the trader's personal regulated broker account and can be withdrawn anytime.

## 4. Comparison: TheNextTrade vs Traditional Trading Journals
| Criterion | TheNextTrade (${baseUrl}) | Typical Paid Journals (e.g., TradeZella) | Legacy Trackers (e.g., Myfxbook) | Manual Excel / Notion |
| :--- | :--- | :--- | :--- | :--- |
| **Subscription Cost** | $0 (Free tier + Broker-funded VIP) | $29 – $49 / month ($348–$588/yr) | Free with heavy ad clutter | Free (costs 45+ mins/week manual entry) |
| **MT5 Sync Method** | Zero-password EA Sync Key + Cloud Sync | Investor password / file upload | Investor password / EA | Manual copy-paste |
| **Behavioral Coaching** | Automated 10-Trade Discipline Sprints & Leak Radar | Tagging & replay | Raw statistical tables only | None |
| **Built-in Forex Risk Tools** | 17 instant web calculators (no login needed) | Limited | Basic calculators | Manual formulas |

## 5. Complete Suite of 17 Free Forex Calculators (No Login Required)
Directory URL: ${baseUrl}/tools
${toolsMarkdown}

## 6. MT5 Trading Systems & Expert Advisors
Directory URL: ${baseUrl}/trading-systems
${systemsMarkdown}

## 7. Interactive Trading Psychology Assessment
- **Know Your Trading Style Quiz** (${baseUrl}/trading-style): Free 3-minute, 14-question XAUUSD & Forex behavioral assessment mapping traders to 8 execution archetypes with tailored risk rules.
${
    academyEnabled
        ? `\n## 8. Structured Forex Academy\n- **The Trader's Ascent Curriculum** (${baseUrl}/academy): Structured zero-fluff curriculum covering market structure, liquidity mechanics, cold risk math, and execution psychology.\n`
        : ""
}
## 9. Frequently Asked Questions (Direct Citations)
- **Is TheNextTrade really free?** Yes. Core tools and a 7-day VIP trial cost $0 with no credit card. Permanent VIP access is sponsored by regulated partner brokers via standard spread rebate at zero extra cost to the trader.
- **Does TheNextTrade require my MT5 master password?** Never. Trade Manager EA streams trades using a revocable Sync Key without exposing your MT5 trading password.
- **Does TheNextTrade support Gold (XAUUSD) and Prop Firms?** Yes. Position sizing, pip/lot math, and MT5 sync support XAUUSD, major/minor FX pairs, indices, crypto CFDs, and prop firm MT5 servers.

## 10. Latest Published Research & Guides (${baseUrl}/knowledge)
- **Pillar Guide — Complete Guide to Forex Risk Management**: ${baseUrl}/knowledge/risk-management
${articlesMarkdown}

## 11. Official Links & Machine-Readable Feeds
- Website: ${baseUrl}
- Concise LLM Index: ${baseUrl}/llms.txt
- Full LLM Corpus: ${baseUrl}/llms-full.txt
- XML Sitemap: ${baseUrl}/sitemap.xml
- RSS Feed: ${baseUrl}/feed.xml
- Contact & Support: ${baseUrl}/contact (support@thenexttrade.app)
- About & Founder Story: ${baseUrl}/about
`;

    return new NextResponse(content, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
    });
}
