
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

    // ============================================================================
    // 1. CMS CATEGORIES & ARTICLES
    // ============================================================================
    // ============================================================================
    // 1. CMS CATEGORIES & ARTICLES
    // ============================================================================
    const categories = [
        { name: "Forex Basics", slug: "forex-basics", description: "Essential knowledge for beginners." },
        { name: "Technical Analysis", slug: "technical-analysis", description: "Chart patterns, indicators, and price action." },
        { name: "Fundamental Analysis", slug: "fundamental-analysis", description: "Economic news and global events." },
        { name: "Trading Strategies", slug: "trading-strategies", description: "Proven trading systems." },
        { name: "Market News", slug: "market-news", description: "Daily market updates." },
        { name: "Psychology", slug: "trading-psychology", description: "Master your mind." },
        { name: "Risk Management", slug: "risk-management", description: "Protect your capital." },
        { name: "Crypto Trading", slug: "crypto-trading", description: "Bitcoin and Altcoins." },
    ];

    // Create Default Admin User first
    // Create Default Admin User
    const adminUser = await prisma.user.upsert({
        where: { email: "admin@gsn.com" },
        update: {},
        create: {
            email: "admin@gsn.com",
            name: "Board Admin",
            id: "00000000-0000-0000-0000-000000000000",
            profile: {
                create: {
                    role: "ADMIN",
                    username: "admin_gsn"
                }
            }
        }
    });

    // Create Requested Admin User (keezimin@gmail.com)
    // Note: ID is auto-generated specific UUID for testing. 
    // In real Supabase auth, this ID should match auth.users.id
    const customAdmin = await prisma.user.upsert({
        where: { email: "keezimin@gmail.com" },
        update: {},
        create: {
            email: "keezimin@gmail.com",
            name: "Kee Admin",
            id: "11111111-1111-1111-1111-111111111111", // Fixed UUID for consistency
            profile: {
                create: {
                    role: "ADMIN",
                    username: "keezimin"
                }
            }
        }
    });


    // Content Templates for realistic generation
    const forexTopics = [
        "Mastering the %TOPIC%: A Comprehensive Guide",
        "Top 5 %TOPIC% Secrets Pro Traders Use",
        "How to Trade %TOPIC% Like a Hedge Fund Manager",
        "The Truth About %TOPIC% No One Tells You",
        "%TOPIC% Explained: Simple & Effective",
        "Avoid These Common %TOPIC% Mistakes",
        "Advanced %TOPIC% Strategies for 2025",
        "Why %TOPIC% is Key to Your Success",
        "A Beginner's Guide to %TOPIC%",
        "The Ultimate %TOPIC% Checklist"
    ];

    const categoryKeywords: Record<string, string[]> = {
        "forex-basics": ["Leverage", "Pips", "Spread", "Majors", "Lot Size", "Brokers", "MT4", "Sessions", "Orders", "Margin"],
        "technical-analysis": ["RSI", "MACD", "Fibonacci", "Support & Resistance", "Candlesticks", "Head & Shoulders", "Moving Averages", "Trendlines", "Price Action", "Bollinger Bands"],
        "fundamental-analysis": ["NFP", "Interest Rates", "GDP", "CPI", "Central Banks", "Inflation", "Employment Data", "Geopolitics", "FOMC", "News Trading"],
        "trading-strategies": ["Scalping", "Swing Trading", "Day Trading", "Position Trading", "Breakout Strategy", "Trend Following", "Range Trading", "Grid Trading", "Carry Trade", "News Straddle"],
        "market-news": ["EURUSD Update", "Gold Analysis", "USD Strength", "Yen Weakness", "Crypto Crash", "Oil Surge", "Fed Decision", "ECB Meeting", "Asian Session", "Market Open"],
        "trading-psychology": ["Discipline", "FOMO", "Fear", "Greed", "Patience", "Consistency", "Burnout", "Routine", "Mindset", "Confidence"],
        "risk-management": ["Stop Loss", "Position Sizing", "Risk Reward", "Drawdown", "Capital Preservation", "Diversification", "Leverage Control", "Expectancy", "Kelly Criterion", "Journaling"],
        "crypto-trading": ["Bitcoin", "Ethereum", "DeFi", "Altcoins", "Blockchain", "Wallets", "Exchanges", "Staking", "NFTs", "Regulation"],
    };

    for (const cat of categories) {
        const category = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat
        });

        console.log(`Seeding Category: ${cat.name}`);
        const keywords = categoryKeywords[cat.slug] || ["Forex", "Trading", "Money", "Markets", "Charts", "Analysis", "Profits", "Risk", "Strategy", "Tools"];

        for (let i = 0; i < 10; i++) {
            const keyword = keywords[i % keywords.length];
            const topicTemplate = forexTopics[i % forexTopics.length];
            const title = topicTemplate.replace("%TOPIC%", keyword);
            const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}-${i}`;

            const imageUrl = "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80";

            await prisma.article.upsert({
                where: { slug },
                update: {
                    thumbnail: imageUrl
                },
                create: {
                    title,
                    slug,
                    categoryId: category.id,
                    authorId: adminUser.id,
                    excerpt: `Learn everything you need to know about ${keyword} in this detailed breakdown. Essential for traders of all levels.`,
                    content: `
                        <h2>Introduction to ${keyword}</h2>
                        <p>${keyword} is a fundamental concept in Forex trading that determines...</p>
                        <h3>Why It Matters</h3>
                        <p>Successful traders understand that mastering ${keyword} entails...</p>
                        <h3>Key Takeaways</h3>
                        <ul>
                            <li>Understand the basics of ${keyword}.</li>
                            <li>Applied strategies for real-market conditions.</li>
                            <li>Risk management tips when dealing with ${keyword}.</li>
                        </ul>
                        <p>Start practicing this concept on your demo account today!</p>
                    `,
                    status: "PUBLISHED",
                    isFeatured: i === 0, // Make the first one featured
                    views: Math.floor(Math.random() * 5000), // Random views for analytics
                    thumbnail: imageUrl
                }
            });
        }
    }

    // ============================================================================
    // 2. ACADEMY CURRICULUM (Expanded)
    // ============================================================================

    // Level 1: Foundation
    const level1 = await prisma.level.upsert({
        where: { order: 1 },
        update: {},
        create: {
            title: "Level 1: Foundation",
            description: "Build a solid base for your trading career.",
            order: 1,
            modules: {
                create: [
                    {
                        title: "Introduction to Forex",
                        order: 1,
                        description: "What is Forex and how does it work?",
                        lessons: {
                            create: [
                                { title: "What is Forex?", slug: "what-is-forex", content: "# What is Forex?\n\nThe Foreign Exchange Market (Forex) is...", order: 1, duration: 5 },
                                { title: "Currency Pairs", slug: "currency-pairs", content: "# Currency Pairs\n\nUnderstanding Majors, Minors, and Exotics...", order: 2, duration: 8 },
                                { title: "Market Sessions", slug: "market-sessions", content: "# Trading Sessions\n\nSydney, Tokyo, London, and New York...", order: 3, duration: 6 }
                            ]
                        }
                    },
                    {
                        title: "Forex Terminology",
                        order: 2,
                        description: "Speak the language of traders.",
                        lessons: {
                            create: [
                                { title: "Pips & Pipettes", slug: "pips-and-pipettes", content: "# Pips\n\nPercentage in Point...", order: 1, duration: 10 },
                                { title: "Lots & Leverage", slug: "lots-and-leverage", content: "# Leverage\n\nA double-edged sword...", order: 2, duration: 12 },
                                { title: "Bid, Ask & Spread", slug: "bid-ask-spread", content: "# The Spread\n\nThe cost of doing business...", order: 3, duration: 7 }
                            ]
                        }
                    }
                ]
            }
        }
    });

    // Level 2: Analysis (Technical)
    await prisma.level.upsert({
        where: { order: 2 },
        update: {},
        create: {
            title: "Level 2: Technical Mastery",
            description: "Read the charts like a pro.",
            order: 2,
            modules: {
                create: [
                    {
                        title: "Chart Basics",
                        order: 1,
                        description: "Candlesticks and Timeframes.",
                        lessons: {
                            create: [
                                { title: "Japanese Candlesticks", slug: "candlesticks", content: "# Candlestick Anatomy\n\nOpen, High, Low, Close...", order: 1, duration: 15 },
                                { title: "Support & Resistance", slug: "support-resistance", content: "# Support & Resistance\n\nThe most important concept...", order: 2, duration: 20 }
                            ]
                        }
                    },
                    {
                        title: "Trend Analysis",
                        order: 2,
                        description: "Trendlines and Channels.",
                        lessons: {
                            create: [
                                { title: "Drawing Trendlines", slug: "drawing-trendlines", content: "# Trendlines\n\nConnect the lows in an uptrend...", order: 1, duration: 10 }
                            ]
                        }
                    }
                ]
            }
        }
    });

    // ============================================================================
    // 3. QUIZ (For Level 1, Module 1)
    // ============================================================================

    // Find Module 1
    const module1 = await prisma.module.findFirst({
        where: { level: { order: 1 }, order: 1 },
        include: { quiz: true }
    });

    if (module1 && !module1.quiz) {
        await prisma.quiz.create({
            data: {
                title: "Forex Basics Quiz",
                description: "Test your knowledge on Forex fundamentals.",
                moduleId: module1.id,
                questions: {
                    create: [
                        {
                            text: "What does Forex stand for?",
                            order: 1,
                            options: {
                                create: [
                                    { text: "Foreign Exchange", isCorrect: true },
                                    { text: "For Example", isCorrect: false },
                                    { text: "Force Extra", isCorrect: false }
                                ]
                            }
                        },
                        {
                            text: "Which currency pair is the most traded?",
                            order: 2,
                            options: {
                                create: [
                                    { text: "GBP/USD", isCorrect: false },
                                    { text: "EUR/USD", isCorrect: true },
                                    { text: "USD/JPY", isCorrect: false }
                                ]
                            }
                        },
                        {
                            text: "What is a Pip?",
                            order: 3,
                            options: {
                                create: [
                                    { text: "Percentage in Point", isCorrect: true },
                                    { text: "Price Interest Point", isCorrect: false },
                                    { text: "Profit In Pocket", isCorrect: false }
                                ]
                            }
                        }
                    ]
                }
            }
        });
        console.log("Quiz created for Module 1");
    }

    console.log("Seeding completed.");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
