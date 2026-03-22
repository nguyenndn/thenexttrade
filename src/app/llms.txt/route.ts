import { NextResponse } from 'next/server';

export async function GET() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thenexttrade.vercel.app';

    const content = `# TheNextTrade
> Professional Forex Trading Tools & Academy

## About
TheNextTrade is a forex trading education platform built by traders, for traders. We provide structured learning paths, professional trading tools, and market analysis to help traders develop discipline and consistency.

## Main Sections

### Academy
Structured forex education from beginner to advanced.
- Covers: Forex basics, technical analysis, fundamental analysis, risk management, trading psychology
- 11 levels from Initiate to Master Trader
- URL: ${baseUrl}/academy

### Articles & Knowledge Base
In-depth trading articles, market analysis, and educational guides.
- Categories: Technical Analysis, Fundamental Analysis, Trading Psychology, Risk Management, Market News
- URL: ${baseUrl}/articles

### Trading Tools
Free professional-grade tools for traders:
- Position Size Calculator: ${baseUrl}/tools/risk-calculator
- Market Hours Clock: ${baseUrl}/tools/market-hours
- Economic Calendar: ${baseUrl}/economic-calendar

### Broker Reviews
Honest, data-driven broker comparisons and reviews.
- URL: ${baseUrl}/brokers

## Content Focus
- Forex & Gold (XAU/USD) trading education
- Risk management and position sizing
- Trading psychology and discipline
- Technical and fundamental analysis
- Structured learning paths (not get-rich-quick schemes)

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
