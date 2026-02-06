/**
 * Mock Data Fixtures for Admin Tests
 */

// ============================================
// User Mocks
// ============================================
export const mockUsers = [
    {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'ADMIN',
        image: '/images/avatar1.jpg',
        createdAt: new Date('2024-01-15'),
        lastLogin: new Date('2024-06-01'),
    },
    {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'USER',
        image: null,
        createdAt: new Date('2024-02-20'),
        lastLogin: new Date('2024-05-28'),
    },
    {
        id: 'user-3',
        name: 'Bob Wilson',
        email: 'bob@example.com',
        role: 'EDITOR',
        image: '/images/avatar3.jpg',
        createdAt: new Date('2024-03-10'),
        lastLogin: new Date('2024-06-02'),
    },
];

export const mockUserStats = {
    totalUsers: 1500,
    newUsersThisMonth: 120,
    activeUsers: 850,
    roleDistribution: {
        ADMIN: 5,
        EDITOR: 15,
        USER: 1480,
    },
};

// ============================================
// Article Mocks
// ============================================
export const mockArticles = [
    {
        id: 'article-1',
        title: 'Getting Started with Forex Trading',
        slug: 'getting-started-forex-trading',
        content: '<p>Forex trading basics content...</p>',
        excerpt: 'Learn the basics of forex trading',
        status: 'PUBLISHED',
        views: 1250,
        viewCount: 1250,
        thumbnail: '/images/article1.jpg',
        featuredImage: '/images/article1.jpg',
        metaTitle: 'Getting Started with Forex Trading | GSN',
        metaDescription: 'Learn forex trading basics',
        createdAt: new Date('2024-01-20'),
        author: { name: 'John Doe', image: '/images/avatar1.jpg' },
        category: { name: 'Trading Basics' },
        categoryId: 'cat-1',
        authorId: 'user-1',
        tags: [{ id: 'tag-1', name: 'forex' }],
    },
    {
        id: 'article-2',
        title: 'Advanced Technical Analysis',
        slug: 'advanced-technical-analysis',
        content: '<p>Technical analysis content...</p>',
        excerpt: 'Master technical analysis',
        status: 'DRAFT',
        views: 0,
        viewCount: 0,
        thumbnail: null,
        featuredImage: null,
        metaTitle: '',
        metaDescription: '',
        createdAt: new Date('2024-02-15'),
        author: { name: 'Jane Smith', image: null },
        category: { name: 'Analysis' },
        categoryId: 'cat-2',
        authorId: 'user-2',
        tags: [],
    },
    {
        id: 'article-3',
        title: 'Risk Management Strategies',
        slug: 'risk-management-strategies',
        content: '<p>Risk management content...</p>',
        excerpt: 'Learn risk management',
        status: 'PENDING',
        views: 450,
        viewCount: 450,
        thumbnail: '/images/article3.jpg',
        featuredImage: '/images/article3.jpg',
        metaTitle: 'Risk Management',
        metaDescription: 'Risk management strategies for traders',
        createdAt: new Date('2024-03-01'),
        author: { name: 'Bob Wilson', image: '/images/avatar3.jpg' },
        category: { name: 'Strategy' },
        categoryId: 'cat-3',
        authorId: 'user-3',
        tags: [{ id: 'tag-1', name: 'forex' }, { id: 'tag-3', name: 'stocks' }],
    },
];

export const mockAuthors = [
    { id: 'user-1', name: 'John Doe' },
    { id: 'user-2', name: 'Jane Smith' },
    { id: 'user-3', name: 'Bob Wilson' },
];

// ============================================
// Category & Tag Mocks
// ============================================
export const mockCategories = [
    { id: 'cat-1', name: 'Trading Basics', slug: 'trading-basics', description: 'Basic trading concepts', _count: { articles: 25 } },
    { id: 'cat-2', name: 'Analysis', slug: 'analysis', description: 'Technical and fundamental analysis', _count: { articles: 18 } },
    { id: 'cat-3', name: 'Strategy', slug: 'strategy', description: 'Trading strategies', _count: { articles: 12 } },
];

export const mockTags = [
    { id: 'tag-1', name: 'forex', slug: 'forex', _count: { articles: 45 } },
    { id: 'tag-2', name: 'crypto', slug: 'crypto', _count: { articles: 30 } },
    { id: 'tag-3', name: 'stocks', slug: 'stocks', _count: { articles: 22 } },
];

// ============================================
// Academy Mocks
// ============================================
export const mockLevels = [
    {
        id: 'level-1',
        name: 'Beginner',
        title: 'Beginner',
        description: 'Introduction to trading basics',
        order: 1,
        modulesCount: 5,
        _count: { modules: 5 },
        modules: [{ id: 'module-1' }, { id: 'module-2' }],
    },
    {
        id: 'level-2',
        name: 'Intermediate',
        title: 'Intermediate',
        description: 'Advanced concepts and strategies',
        order: 2,
        modulesCount: 8,
        _count: { modules: 8 },
        modules: [],
    },
    {
        id: 'level-3',
        name: 'Advanced',
        title: 'Advanced',
        description: 'Professional trading techniques',
        order: 3,
        modulesCount: 3,
        _count: { modules: 3 },
        modules: [],
    },
];

export const mockModules = [
    {
        id: 'module-1',
        title: 'Introduction to Forex',
        order: 1,
        levelId: 'level-1',
        _count: { lessons: 10 },
    },
    {
        id: 'module-2',
        title: 'Currency Pairs',
        order: 2,
        levelId: 'level-1',
        _count: { lessons: 8 },
    },
];

export const mockLessons = [
    {
        id: 'lesson-1',
        title: 'What is Forex?',
        order: 1,
        moduleId: 'module-1',
        content: '<p>Forex trading basics...</p>',
    },
    {
        id: 'lesson-2',
        title: 'Understanding Pips',
        order: 2,
        moduleId: 'module-1',
        content: '<p>Pip calculation...</p>',
    },
];

export const mockQuizzes = [
    {
        id: 'quiz-1',
        title: 'Forex Basics Quiz',
        lessonId: 'lesson-1',
        _count: { questions: 10 },
    },
];

export const mockQuestions = [
    {
        id: 'q-1',
        quizId: 'quiz-1',
        question: 'What does Forex stand for?',
        options: ['Foreign Exchange', 'Forward Exchange', 'Future Exchange', 'First Exchange'],
        correctAnswer: 0,
        order: 1,
    },
];

// ============================================
// EA Product Mocks
// ============================================
export const mockEAProducts = [
    {
        id: 'ea-1',
        name: 'Golden Scalper EA',
        slug: 'golden-scalper-ea',
        type: 'AUTO_TRADE',
        platform: 'MT5',
        version: '2.5.1',
        description: 'Automated scalping EA',
        isActive: true,
        totalDownloads: 1250,
        licensesCount: 120,
        downloadsCount: 1250,
        createdAt: new Date('2024-01-10'),
        thumbnail: '/images/ea1.jpg',
    },
    {
        id: 'ea-2',
        name: 'Trend Indicator Pro',
        slug: 'trend-indicator-pro',
        type: 'INDICATOR',
        platform: 'MT5',
        version: '1.0.0',
        description: 'Professional trend indicator',
        isActive: true,
        totalDownloads: 890,
        licensesCount: 85,
        downloadsCount: 890,
        createdAt: new Date('2024-02-20'),
        thumbnail: null,
    },
    {
        id: 'ea-3',
        name: 'Manual Trade Assistant',
        slug: 'manual-trade-assistant',
        type: 'MANUAL_ASSIST',
        platform: 'MT5',
        version: '3.1.0',
        description: 'Semi-automated trading assistant',
        isActive: false,
        totalDownloads: 450,
        licensesCount: 40,
        downloadsCount: 450,
        createdAt: new Date('2024-03-15'),
        thumbnail: '/images/ea3.jpg',
    },
];

export const mockLicenseAccounts = [
    {
        id: 'license-1',
        userId: 'user-1',
        productId: 'ea-1',
        accountNumber: '12345678',
        brokerName: 'XM Global',
        status: 'APPROVED',
        createdAt: new Date('2024-04-01'),
        user: { name: 'John Doe', email: 'john@example.com' },
        product: { name: 'Golden Scalper EA' },
    },
    {
        id: 'license-2',
        userId: 'user-2',
        productId: 'ea-1',
        accountNumber: '87654321',
        brokerName: 'IC Markets',
        status: 'PENDING',
        createdAt: new Date('2024-04-15'),
        user: { name: 'Jane Smith', email: 'jane@example.com' },
        product: { name: 'Golden Scalper EA' },
    },
];

// ============================================
// Dashboard Stats Mocks
// ============================================
export const mockDashboardStats = {
    totalUsers: 1500,
    totalArticles: 120,
    totalLessons: 85,
    totalQuizzes: 30,
    totalTrades: 5600,
    totalComments: 450,
    newUsers: 25,
    newUsersToday: 12,
    publishedArticles: 95,
    pendingArticles: 5,
    pendingComments: 8,
    pendingLicenses: 3,
    pageViews: 125000,
};

// ============================================
// Notification Mocks
// ============================================
export const mockNotifications = [
    {
        id: 'notif-1',
        type: 'NEW_LICENSE_REQUEST',
        title: 'New License Request',
        message: 'John Doe requested a license for Golden Scalper EA',
        link: '/admin/ea/accounts/pending',
        isRead: false,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'notif-2',
        type: 'SYSTEM_ALERT',
        title: 'System Update',
        message: 'System maintenance scheduled for tonight',
        link: '/admin/system',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
];

export const mockAdminStats = {
    pendingLicenses: 3,
    unreadNotifications: 1,
    activeSessions: 42,
    pendingApprovals: 5,
    serverStatus: 'healthy',
};

// ============================================
// Comments Mocks
// ============================================
export const mockComments = [
    {
        id: 'comment-1',
        content: 'Great article! Very helpful.',
        createdAt: new Date('2024-05-01'),
        user: { name: 'John Doe', image: '/images/avatar1.jpg' },
        article: { title: 'Getting Started with Forex Trading' },
    },
    {
        id: 'comment-2',
        content: 'I have a question about risk management.',
        createdAt: new Date('2024-05-10'),
        user: { name: 'Jane Smith', image: null },
        article: { title: 'Risk Management Strategies' },
    },
];

// ============================================
// Broadcast Mocks
// ============================================
export const mockBroadcasts = [
    {
        id: 'broadcast-1',
        title: 'System Maintenance Notice',
        content: 'We will be performing system maintenance on Saturday.',
        targetAudience: 'ALL',
        scheduledAt: null,
        sentAt: new Date('2024-05-01'),
        createdBy: { name: 'Admin' },
    },
    {
        id: 'broadcast-2',
        title: 'New Course Available',
        content: 'Check out our new Advanced Trading course!',
        targetAudience: 'USERS',
        scheduledAt: new Date('2024-06-01'),
        sentAt: null,
        createdBy: { name: 'Admin' },
    },
];

// ============================================
// Settings Mocks
// ============================================
export const mockSettings = [
    { key: 'site_name', value: 'GSN Trading Academy', category: 'general', description: 'The name of the site' },
    { key: 'site_description', value: 'Learn to trade forex', category: 'general', description: 'Site description for SEO' },
    { key: 'maintenance_mode', value: 'false', category: 'system', description: 'Enable maintenance mode' },
    { key: 'registration_enabled', value: 'true', category: 'system', description: 'Allow new user registration' },
    { key: 'max_upload_size', value: '10', category: 'uploads', description: 'Maximum file upload size in MB' },
];

// ============================================
// Audit Log Mocks
// ============================================
export const mockAuditLogs = [
    {
        id: 'log-1',
        action: 'CREATE_ARTICLE',
        userId: 'user-1',
        targetId: 'article-1',
        entityType: 'ARTICLE',
        details: { title: 'New Article' },
        oldValues: null,
        newValues: { title: 'New Article' },
        createdAt: new Date('2024-05-01').toISOString(),
        user: { name: 'John Doe' },
    },
    {
        id: 'log-2',
        action: 'DELETE_USER',
        userId: 'user-1',
        targetId: 'user-5',
        entityType: 'USER',
        details: { email: 'deleted@example.com' },
        oldValues: { email: 'deleted@example.com' },
        newValues: null,
        createdAt: new Date('2024-05-02').toISOString(),
        user: { name: 'John Doe' },
    },
];

// ============================================
// Broker Mocks
// ============================================
export const mockBrokers = [
    {
        id: 'broker-1',
        name: 'XM Trading',
        slug: 'xm-trading',
        description: 'International forex broker',
        rating: 4.5,
        isActive: true,
        isFeatured: true,
        logo: '/images/brokers/xm.png',
        minDeposit: 5,
        leverage: '1:888',
        regulations: ['CySEC', 'ASIC'],
        platforms: ['MT4', 'MT5'],
        createdAt: new Date('2024-01-01'),
    },
    {
        id: 'broker-2',
        name: 'IC Markets',
        slug: 'ic-markets',
        description: 'ECN forex broker',
        rating: 4.8,
        isActive: false,
        isFeatured: false,
        logo: '/images/brokers/icmarkets.png',
        minDeposit: 200,
        leverage: '1:500',
        regulations: ['ASIC', 'FSA'],
        platforms: ['MT4', 'MT5', 'cTrader'],
        createdAt: new Date('2024-01-15'),
    },
];
