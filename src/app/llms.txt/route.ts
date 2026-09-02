import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/url";

export async function GET() {
    const baseUrl = getBaseUrl();

    const content = `# TheNextTrade
> Professional Forex Trading Tools, Trading Playbook & Market Analytics Platform

## About
TheNextTrade is a forex trading platform built by professional traders and software engineers. We provide 18 free institutional-grade trading calculators, Trading Playbook Studio with Preset Setups, Automated Trade Journal with MT5 Sync, a structured 3-level Academy with 30+ lessons, real-time market data, and a comprehensive knowledge base — empowering retail traders to make data-driven, systematic decisions.

## Main Sections

### Trading Playbook & Journal (The Pro Trader OS)
- Trading Playbook Studio: Build and manage systematic trade setups with defined entry, SL, TP, and reference charts.
- Pre-Flight Execution Checklist: Live compliance scoring to prevent impulsive trades.
- Automated Trade Journal: Multi-broker MT5 sync with edge analytics and psychology leak detection.
- URL: ${baseUrl}/dashboard/strategies

### Trading Tools (18 Free Calculators)
Professional-grade financial calculators for forex risk management and analysis.

**Risk Management:**
- Position Size Calculator: ${baseUrl}/tools/position-size-calculator
- Risk/Reward Calculator: ${baseUrl}/tools/risk-reward-calculator
- Drawdown Calculator: ${baseUrl}/tools/drawdown-calculator
- Risk of Ruin Calculator: ${baseUrl}/tools/risk-of-ruin-calculator

**Trade Calculators:**
- Pip Value Calculator: ${baseUrl}/tools/pip-value-calculator
- Profit/Loss Calculator: ${baseUrl}/tools/profit-loss-calculator
- Margin Calculator: ${baseUrl}/tools/margin-calculator
- Leverage Calculator: ${baseUrl}/tools/leverage-calculator

**Technical Analysis:**
- Fibonacci Calculator: ${baseUrl}/tools/fibonacci-calculator
- Compounding Calculator: ${baseUrl}/tools/compounding-calculator
- Pivot Point Calculator: ${baseUrl}/tools/pivot-point-calculator

**Market Data:**
- Live Market Rates: ${baseUrl}/tools/live-market-rates
- Currency Heat Map: ${baseUrl}/tools/currency-heat-map
- Correlation Matrix: ${baseUrl}/tools/correlation-matrix
- Currency Converter: ${baseUrl}/tools/currency-converter
- Economic Calendar: ${baseUrl}/tools/economic-calendar
- Market Hours: ${baseUrl}/tools/market-hours

### Academy (Structured Education)
3-level forex trading education from beginner to advanced.
- Level 1: Foundation (Forex Basics, Candlestick Charts, Support & Resistance)
- Level 2: Strategy (Technical Indicators, Risk Management, Trade Planning)
- Level 3: Mastery (Advanced Patterns, Psychology, System Building)
- Public Lessons (free, no login required): Levels 1-3 first chapters
- URL: ${baseUrl}/academy

### Knowledge Hub (Pillar Content)
Comprehensive, in-depth guides on core trading topics.

**Pillar Pages:**
- Forex Risk Management Guide: ${baseUrl}/knowledge/risk-management
- Knowledge Index: ${baseUrl}/knowledge

### Articles & Analysis
In-depth trading articles, market analysis, and educational content.
- Categories: Technical Analysis, Fundamental Analysis, Trading Psychology, Risk Management
- URL: ${baseUrl}/articles

### Broker Reviews
Honest, data-driven forex broker comparisons and reviews.
- URL: ${baseUrl}/brokers

## Automation & Integration Capabilities
- RESTful API for market data (live rates, correlations, economic events)
- AI Plugin manifest: ${baseUrl}/.well-known/ai-plugin.json
- Structured data (JSON-LD): Organization, WebSite, Course, FAQPage, SoftwareApplication, HowTo
- LLMs file: ${baseUrl}/llms.txt
- Sitemap: ${baseUrl}/sitemap.xml
- Robots: ${baseUrl}/robots.txt

## Content Focus
- Forex & Gold (XAU/USD) trading education
- Risk management and position sizing
- Trading psychology and discipline
- Technical and fundamental analysis
- Structured learning paths (not get-rich-quick schemes)
- Anti-signal-seller philosophy — teaching systems, not selling signals

## Contact
- URL: ${baseUrl}/contact
- About: ${baseUrl}/about
`;

    return new NextResponse(content, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
    });
}
