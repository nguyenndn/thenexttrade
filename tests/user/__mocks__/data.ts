/**
 * User Module Mock Data
 * @module tests/user/__mocks__/data
 */

// ============================================
// User Profile
// ============================================
export const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'John Trader',
    avatar: '/avatars/user-1.jpg',
    role: 'USER',
    status: 'ACTIVE',
    level: 5,
    xp: 2500,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    profile: {
        bio: 'Forex trader with 5 years experience',
        location: 'New York, USA',
        website: 'https://johntrader.com',
        tradingStyle: 'Swing Trading',
        preferredPairs: ['EUR/USD', 'GBP/USD', 'USD/JPY'],
        timezone: 'America/New_York',
    },
    settings: {
        notifications: {
            email: true,
            push: true,
            sms: false,
        },
        privacy: {
            showProfile: true,
            showStats: true,
            showJournal: false,
        },
    },
};

// ============================================
// Trading Accounts
// ============================================
export const mockTradingAccounts = [
    {
        id: 'account-1',
        userId: 'user-1',
        name: 'Main Trading Account',
        broker: 'XM Trading',
        accountNumber: '12345678',
        accountType: 'LIVE',
        currency: 'USD',
        balance: 10000,
        equity: 10250,
        leverage: '1:100',
        platform: 'MT5',
        isActive: true,
        isPrimary: true,
        createdAt: '2024-06-01T00:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
    },
    {
        id: 'account-2',
        userId: 'user-1',
        name: 'Demo Practice',
        broker: 'IC Markets',
        accountNumber: '87654321',
        accountType: 'DEMO',
        currency: 'USD',
        balance: 50000,
        equity: 52000,
        leverage: '1:500',
        platform: 'MT4',
        isActive: true,
        isPrimary: false,
        createdAt: '2024-08-01T00:00:00Z',
        updatedAt: '2025-01-10T08:00:00Z',
    },
];

// ============================================
// Journal Entries
// ============================================
export const mockJournalEntries = [
    {
        id: 'entry-1',
        userId: 'user-1',
        accountId: 'account-1',
        symbol: 'EURUSD',
        type: 'BUY',
        entryPrice: 1.0850,
        exitPrice: 1.0920,
        lotSize: 0.5,
        stopLoss: 1.0800,
        takeProfit: 1.0950,
        pnl: 350,
        pips: 70,
        status: 'CLOSED',
        result: 'WIN',
        entryDate: '2025-01-10T09:00:00Z',
        exitDate: '2025-01-10T14:30:00Z',
        notes: 'Good breakout trade on EUR/USD',
        emotions: 'Confident',
        rating: 4,
        tags: ['breakout', 'trend'],
        screenshots: ['/uploads/trade-1.png'],
        createdAt: '2025-01-10T09:00:00Z',
        updatedAt: '2025-01-10T14:30:00Z',
    },
    {
        id: 'entry-2',
        userId: 'user-1',
        accountId: 'account-1',
        symbol: 'GBPUSD',
        type: 'SELL',
        entryPrice: 1.2650,
        exitPrice: 1.2580,
        lotSize: 0.3,
        stopLoss: 1.2700,
        takeProfit: 1.2550,
        pnl: 210,
        pips: 70,
        status: 'CLOSED',
        result: 'WIN',
        entryDate: '2025-01-12T10:00:00Z',
        exitDate: '2025-01-12T16:00:00Z',
        notes: 'Reversal trade on resistance',
        emotions: 'Calm',
        rating: 5,
        tags: ['reversal', 'resistance'],
        screenshots: [],
        createdAt: '2025-01-12T10:00:00Z',
        updatedAt: '2025-01-12T16:00:00Z',
    },
    {
        id: 'entry-3',
        userId: 'user-1',
        accountId: 'account-1',
        symbol: 'USDJPY',
        type: 'BUY',
        entryPrice: 148.50,
        exitPrice: null,
        lotSize: 0.2,
        stopLoss: 148.00,
        takeProfit: 149.50,
        pnl: null,
        pips: null,
        status: 'OPEN',
        result: null,
        entryDate: '2025-01-15T08:00:00Z',
        exitDate: null,
        notes: 'Following the trend',
        emotions: 'Neutral',
        rating: null,
        tags: ['trend'],
        screenshots: [],
        createdAt: '2025-01-15T08:00:00Z',
        updatedAt: '2025-01-15T08:00:00Z',
    },
];

// ============================================
// Journal Stats
// ============================================
export const mockJournalStats = {
    totalTrades: 150,
    winRate: 65.5,
    profitFactor: 1.8,
    totalPnl: 5250,
    averageWin: 120,
    averageLoss: -65,
    bestTrade: 450,
    worstTrade: -180,
    consecutiveWins: 8,
    consecutiveLosses: 3,
    tradingDays: 45,
    averageTradesPerDay: 3.3,
    bySymbol: {
        'EUR/USD': { trades: 50, pnl: 2100, winRate: 68 },
        'GBP/USD': { trades: 40, pnl: 1800, winRate: 62 },
        'USD/JPY': { trades: 35, pnl: 850, winRate: 60 },
        'Others': { trades: 25, pnl: 500, winRate: 64 },
    },
    byDay: {
        Monday: { trades: 30, pnl: 1200 },
        Tuesday: { trades: 35, pnl: 1500 },
        Wednesday: { trades: 28, pnl: 900 },
        Thursday: { trades: 32, pnl: 1100 },
        Friday: { trades: 25, pnl: 550 },
    },
    byHour: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        trades: Math.floor(Math.random() * 10),
        pnl: Math.floor(Math.random() * 500) - 100,
    })),
};

// ============================================
// Academy Progress
// ============================================
export const mockAcademyLevels = [
    {
        id: 'level-1',
        name: 'Beginner',
        order: 1,
        description: 'Introduction to Forex Trading',
        totalLessons: 10,
        completedLessons: 10,
        progress: 100,
        isUnlocked: true,
        isCompleted: true,
    },
    {
        id: 'level-2',
        name: 'Intermediate',
        order: 2,
        description: 'Technical Analysis Fundamentals',
        totalLessons: 15,
        completedLessons: 12,
        progress: 80,
        isUnlocked: true,
        isCompleted: false,
    },
    {
        id: 'level-3',
        name: 'Advanced',
        order: 3,
        description: 'Advanced Trading Strategies',
        totalLessons: 20,
        completedLessons: 0,
        progress: 0,
        isUnlocked: false,
        isCompleted: false,
    },
];

export const mockLessons = [
    {
        id: 'lesson-1',
        moduleId: 'module-1',
        title: 'What is Forex?',
        type: 'VIDEO',
        duration: 15,
        order: 1,
        isCompleted: true,
        completedAt: '2025-01-05T10:00:00Z',
    },
    {
        id: 'lesson-2',
        moduleId: 'module-1',
        title: 'Currency Pairs Explained',
        type: 'TEXT',
        duration: 10,
        order: 2,
        isCompleted: true,
        completedAt: '2025-01-05T11:00:00Z',
    },
    {
        id: 'lesson-3',
        moduleId: 'module-1',
        title: 'How to Read Charts',
        type: 'VIDEO',
        duration: 20,
        order: 3,
        isCompleted: false,
        completedAt: null,
    },
];

export const mockQuizAttempts = [
    {
        id: 'attempt-1',
        quizId: 'quiz-1',
        userId: 'user-1',
        score: 80,
        totalQuestions: 10,
        correctAnswers: 8,
        timeSpent: 300,
        passed: true,
        completedAt: '2025-01-06T10:00:00Z',
    },
    {
        id: 'attempt-2',
        quizId: 'quiz-2',
        userId: 'user-1',
        score: 60,
        totalQuestions: 10,
        correctAnswers: 6,
        passed: false,
        timeSpent: 450,
        completedAt: '2025-01-08T14:00:00Z',
    },
];

// ============================================
// Streak & Gamification
// ============================================
export const mockStreak = {
    currentStreak: 15,
    longestStreak: 30,
    lastCheckIn: '2025-01-15T08:00:00Z',
    totalCheckIns: 120,
    streakMultiplier: 1.5,
    nextMilestone: 20,
    weeklyProgress: [true, true, true, true, true, false, false],
};

export const mockAchievements = [
    {
        id: 'ach-1',
        name: 'First Trade',
        description: 'Complete your first trade journal entry',
        icon: '🎯',
        category: 'TRADING',
        xpReward: 100,
        isUnlocked: true,
        unlockedAt: '2024-06-15T10:00:00Z',
    },
    {
        id: 'ach-2',
        name: 'Week Warrior',
        description: 'Maintain a 7-day login streak',
        icon: '🔥',
        category: 'STREAK',
        xpReward: 200,
        isUnlocked: true,
        unlockedAt: '2024-07-01T10:00:00Z',
    },
    {
        id: 'ach-3',
        name: 'Scholar',
        description: 'Complete all beginner level lessons',
        icon: '📚',
        category: 'ACADEMY',
        xpReward: 500,
        isUnlocked: true,
        unlockedAt: '2025-01-05T10:00:00Z',
    },
    {
        id: 'ach-4',
        name: 'Profit Master',
        description: 'Achieve 100 profitable trades',
        icon: '💰',
        category: 'TRADING',
        xpReward: 1000,
        isUnlocked: false,
        progress: 85,
        unlockedAt: null,
    },
];

export const mockLeaderboard = [
    { rank: 1, userId: 'user-10', name: 'TopTrader', xp: 15000, level: 12 },
    { rank: 2, userId: 'user-5', name: 'ForexKing', xp: 12500, level: 10 },
    { rank: 3, userId: 'user-8', name: 'ChartMaster', xp: 11000, level: 9 },
    { rank: 15, userId: 'user-1', name: 'John Trader', xp: 2500, level: 5 },
];

// ============================================
// Notifications
// ============================================
export const mockNotifications = [
    {
        id: 'notif-1',
        userId: 'user-1',
        type: 'ACHIEVEMENT',
        title: 'New Achievement Unlocked!',
        message: 'You earned the "Scholar" achievement',
        isRead: false,
        data: { achievementId: 'ach-3' },
        createdAt: '2025-01-15T10:00:00Z',
    },
    {
        id: 'notif-2',
        userId: 'user-1',
        type: 'STREAK',
        title: 'Keep Your Streak Going!',
        message: 'You have a 15-day streak. Don\'t break it!',
        isRead: true,
        data: { streak: 15 },
        createdAt: '2025-01-14T08:00:00Z',
    },
    {
        id: 'notif-3',
        userId: 'user-1',
        type: 'ARTICLE',
        title: 'New Article Published',
        message: 'Check out our latest market analysis',
        isRead: false,
        data: { articleId: 'article-1' },
        createdAt: '2025-01-13T12:00:00Z',
    },
    {
        id: 'notif-4',
        userId: 'user-1',
        type: 'SYSTEM',
        title: 'Welcome to GSN CRM',
        message: 'Start your trading journey today',
        isRead: true,
        data: {},
        createdAt: '2024-01-01T00:00:00Z',
    },
];

// ============================================
// Trading Systems / EAs
// ============================================
export const mockEAProducts = [
    {
        id: 'ea-1',
        name: 'Scalper Pro',
        description: 'High-frequency scalping EA',
        type: 'AUTO_TRADE',
        platform: 'MT5',
        version: '2.1.0',
        price: 299,
        isActive: true,
        downloadUrl: '/downloads/scalper-pro.ex5',
    },
    {
        id: 'ea-2',
        name: 'Trend Follower',
        description: 'Trend-following trading robot',
        type: 'AUTO_TRADE',
        platform: 'MT4',
        version: '1.5.0',
        price: 199,
        isActive: true,
        downloadUrl: '/downloads/trend-follower.ex4',
    },
];

export const mockUserLicenses = [
    {
        id: 'license-1',
        userId: 'user-1',
        productId: 'ea-1',
        product: mockEAProducts[0],
        accountNumber: '12345678',
        status: 'APPROVED',
        activatedAt: '2025-01-01T00:00:00Z',
        expiresAt: '2026-01-01T00:00:00Z',
    },
];

// ============================================
// Tools - Risk Calculator
// ============================================
export const mockRiskCalculation = {
    accountBalance: 10000,
    riskPercentage: 2,
    riskAmount: 200,
    entryPrice: 1.0850,
    stopLoss: 1.0800,
    pipValue: 10,
    positionSize: 0.4,
    potentialLoss: 200,
    potentialProfit: 400,
    riskRewardRatio: '1:2',
};

// ============================================
// Articles / Content
// ============================================
export const mockArticles = [
    {
        id: 'article-1',
        title: 'Understanding Support and Resistance',
        slug: 'understanding-support-resistance',
        excerpt: 'Learn how to identify key support and resistance levels',
        content: '<p>Full article content...</p>',
        featuredImage: '/images/articles/support-resistance.jpg',
        category: { id: 'cat-1', name: 'Technical Analysis', slug: 'technical-analysis' },
        author: { id: 'author-1', name: 'GSN Team' },
        viewCount: 1500,
        readingTime: 8,
        publishedAt: '2025-01-10T10:00:00Z',
    },
    {
        id: 'article-2',
        title: 'Risk Management Basics',
        slug: 'risk-management-basics',
        excerpt: 'Essential risk management strategies for traders',
        content: '<p>Full article content...</p>',
        featuredImage: '/images/articles/risk-management.jpg',
        category: { id: 'cat-2', name: 'Trading Psychology', slug: 'trading-psychology' },
        author: { id: 'author-1', name: 'GSN Team' },
        viewCount: 2300,
        readingTime: 12,
        publishedAt: '2025-01-08T10:00:00Z',
    },
];

// ============================================
// Brokers
// ============================================
export const mockBrokers = [
    {
        id: 'broker-1',
        name: 'XM Trading',
        slug: 'xm-trading',
        logo: '/images/brokers/xm.png',
        rating: 4.5,
        minDeposit: 5,
        leverage: '1:1000',
        platforms: ['MT4', 'MT5'],
        regulation: ['CySEC', 'ASIC', 'FCA'],
        features: ['Low spreads', 'Fast execution', '24/7 support'],
        affiliateUrl: 'https://xm.com/ref/123',
        isFeatured: true,
    },
    {
        id: 'broker-2',
        name: 'IC Markets',
        slug: 'ic-markets',
        logo: '/images/brokers/icmarkets.png',
        rating: 4.7,
        minDeposit: 200,
        leverage: '1:500',
        platforms: ['MT4', 'MT5', 'cTrader'],
        regulation: ['ASIC', 'CySEC'],
        features: ['Raw spreads', 'Fast servers', 'ECN'],
        affiliateUrl: 'https://icmarkets.com/ref/123',
        isFeatured: true,
    },
];

// ============================================
// Economic Calendar
// ============================================
export const mockEconomicEvents = [
    {
        id: 'event-1',
        title: 'Non-Farm Payrolls',
        country: 'US',
        currency: 'USD',
        impact: 'HIGH',
        forecast: '180K',
        previous: '175K',
        actual: null,
        datetime: '2025-01-17T13:30:00Z',
    },
    {
        id: 'event-2',
        title: 'ECB Interest Rate Decision',
        country: 'EU',
        currency: 'EUR',
        impact: 'HIGH',
        forecast: '3.25%',
        previous: '3.50%',
        actual: null,
        datetime: '2025-01-23T12:45:00Z',
    },
    {
        id: 'event-3',
        title: 'UK CPI (YoY)',
        country: 'UK',
        currency: 'GBP',
        impact: 'MEDIUM',
        forecast: '4.0%',
        previous: '3.9%',
        actual: '4.1%',
        datetime: '2025-01-15T07:00:00Z',
    },
];

// ============================================
// Search Results
// ============================================
export const mockSearchResults = {
    articles: [mockArticles[0], mockArticles[1]],
    lessons: [mockLessons[0], mockLessons[1]],
    brokers: [mockBrokers[0]],
    total: 5,
};

// ============================================
// Dashboard Stats
// ============================================
export const mockDashboardStats = {
    totalPnl: 5250,
    winRate: 65.5,
    totalTrades: 150,
    openTrades: 3,
    currentStreak: 15,
    level: 5,
    xp: 2500,
    nextLevelXp: 3000,
    academyProgress: 65,
    recentAchievements: [mockAchievements[2]],
};

// ============================================
// Comments
// ============================================
export const mockComments = [
    {
        id: 'comment-1',
        userId: 'user-1',
        articleId: 'article-1',
        content: 'Great article! Very helpful for beginners.',
        likes: 5,
        isLiked: false,
        createdAt: '2025-01-11T10:00:00Z',
    },
    {
        id: 'comment-2',
        userId: 'user-2',
        articleId: 'article-1',
        content: 'Thanks for sharing this knowledge.',
        likes: 3,
        isLiked: true,
        createdAt: '2025-01-12T14:00:00Z',
    },
];
