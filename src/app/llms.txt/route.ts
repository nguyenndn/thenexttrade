import { NextResponse } from 'next/server';

export async function GET() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thenexttrade.vercel.app';

    const content = `# TheNextTrade
> Professional Forex Trading Tools, Education & Market Analysis Platform

## About
TheNextTrade is a forex trading education and tools platform built by professional traders and software engineers. We provide 18 free institutional-grade trading calculators, a structured 3-level Academy with 30+ lessons, real-time market data, and a comprehensive knowledge base — empowering retail traders to make data-driven, systematic decisions.

## Main Sections

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
- URL: ${baseUrl}/academy

### Knowledge Base (Articles & Guides)
In-depth trading articles, market analysis, and educational content.
- Categories: Technical Analysis, Fundamental Analysis, Trading Psychology, Risk Management
- URL: ${baseUrl}/knowledge

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
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
    });
}
