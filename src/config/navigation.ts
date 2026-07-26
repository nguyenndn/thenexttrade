import {
    LayoutDashboard,
    BookOpen,
    Settings,
    LogOut,
    User as UserIcon,
    Wallet,
    GraduationCap,
    Trophy,
    FileText,
    List,
    Users,
    Activity,
    Tag,
    MessageSquare,
    Bot,
    Download,
    BarChart3,
    AlertTriangle,
    FileSpreadsheet,
    Clock,
    Route,
    Zap,
    Bookmark,
    FolderTree,
    Quote,
    MoreHorizontal,
    Copy,
    ShieldAlert,
    MessageCircle,
    Crown,
    TrendingUp,
    UserCheck,
    ClipboardCheck,
    Target,
    HeartPulse,
    FileBarChart,
    Database,
    Mail,
} from "lucide-react";

export const menuItems = [
    {
        name: "Home",
        href: "/",
        type: "link" as const,
    },
    {
        name: "Knowledge",
        href: "/knowledge",
        type: "link" as const,
    },
    {
        name: "Academy",
        href: "/academy",
        type: "link" as const,
    },
    {
        name: "Trading Systems",
        href: "/trading-systems",
        type: "link" as const,
    },
    {
        name: "Tools",
        href: "/tools",
        type: "link" as const,
    },
    {
        name: "Brokers",
        href: "/brokers",
        type: "link" as const,
    },
    {
        name: "Community",
        href: "/community",
        type: "link" as const,
    },
];

export const dashboardMenuItems = [
    // --- OPERATIONS ---
    {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        requiresTradeData: false,
    },
    {
        name: "Accounts & Props",
        href: "/dashboard/accounts",
        icon: Wallet,
        requiresTradeData: false,
    },

    // --- EXECUTION ---
    {
        name: "Trading Journal",
        href: "/dashboard/journal",
        icon: FileText,
        requiresTradeData: true,
    },
    {
        name: "Strategies",
        href: "/dashboard/strategies",
        icon: Route,
        requiresTradeData: false,
    },
    {
        name: "Rules",
        href: "/dashboard/rules",
        icon: ClipboardCheck,
        requiresTradeData: false,
    },

    // --- REVIEW ---
    {
        name: "Analytics Hub",
        href: "/dashboard/analytics",
        icon: BarChart3,
        requiresTradeData: true,
    },
    {
        name: "Psychology",
        href: "/dashboard/psychology",
        icon: Activity,
        requiresTradeData: true,
    },

    // --- RESOURCES ---
    {
        name: "Academy",
        href: "/dashboard/academy",
        icon: GraduationCap,
        requiresTradeData: false,
    },
    {
        name: "Leaderboard",
        href: "/dashboard/leaderboard",
        icon: Trophy,
        requiresTradeData: false,
    },
    {
        name: "Trading System",
        href: "/dashboard/trading-systems",
        icon: Bot,
        requiresTradeData: false,
    },
    {
        name: "Edge Missions",
        href: "/dashboard/missions",
        icon: Target,
        requiresTradeData: false,
    },

    // --- INVESTING ---
    {
        name: "Copy Trading",
        href: "/dashboard/copy-trading",
        icon: Copy,
        featureFlag: "feature_copy_trading",
        requiresTradeData: false,
    },
];

export const adminMenuItems = [
    // --- (No label — first item) ---
    { name: "Overview", href: "/admin", icon: LayoutDashboard },

    // --- MONITORING & AI ---
    {
        name: "AI Gateway",
        href: "/admin/ai",
        icon: Bot,
    },

    {
        name: "Monitoring",
        href: "#",
        icon: HeartPulse,
        items: [
            { name: "Release Health", href: "/admin/release-health" },
            { name: "Reports", href: "/admin/reports" },
            { name: "Analytics", href: "/admin/analytics" },
            { name: "Security", href: "/admin/security" },
        ],
    },

    // --- CONTENT ---
    {
        name: "Content",
        href: "#",
        icon: FileText,
        items: [
            { name: "Articles", href: "/admin/articles" },
            { name: "Article Ops", href: "/admin/articles/ops" },
            { name: "Shortcuts", href: "/admin/articles/shortcuts" },
            { name: "Comments", href: "/admin/comments" },
            { name: "Taxonomy", href: "/admin/taxonomy" },
            { name: "Quotes", href: "/admin/quotes" },
        ],
    },

    // --- EDUCATION ---
    { name: "Academy", href: "/admin/academy", icon: GraduationCap },

    // --- IB & VIP ---
    {
        name: "IB & VIP",
        href: "#",
        icon: Users,
        items: [
            { name: "IB Overview", href: "/admin/ib" },
            { name: "VIP Pipeline", href: "/admin/ib/pipeline" },
            { name: "Trader Monitor (CRM)", href: "/admin/ib/traders" },
        ],
    },

    // --- INVESTING ---
    { name: "Copy Trading", href: "/admin/copy-trading", icon: Copy },

    // --- SYSTEM ---
    {
        name: "System",
        href: "#",
        icon: Settings,
        items: [
            { name: "Trading Systems", href: "/admin/trading-systems" },
            { name: "Users", href: "/admin/users" },
            { name: "Feedback", href: "/admin/feedback" },
            { name: "Settings", href: "/admin/settings" },
            { name: "Email Lab", href: "/admin/email-lab" },
        ],
    },
];

// Mobile bottom tab bar groups (first 3 groups + "More" for remainder)
export const dashboardMenuGroups = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        items: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            {
                name: "Accounts & Props",
                href: "/dashboard/accounts",
                icon: Wallet,
            },
        ],
    },
    {
        label: "Journal",
        icon: FileText,
        items: [
            {
                name: "Trading Journal",
                href: "/dashboard/journal",
                icon: FileText,
            },
            { name: "Strategies", href: "/dashboard/strategies", icon: Route },
            { name: "Rules", href: "/dashboard/rules", icon: ClipboardCheck },
        ],
    },
    {
        label: "Analytics",
        icon: BarChart3,
        items: [
            {
                name: "Analytics Hub",
                href: "/dashboard/analytics",
                icon: BarChart3,
            },
            {
                name: "Psychology",
                href: "/dashboard/psychology",
                icon: Activity,
            },
        ],
    },
    {
        label: "More",
        icon: MoreHorizontal,
        items: [
            {
                name: "Academy",
                href: "/dashboard/academy",
                icon: GraduationCap,
            },
            {
                name: "Leaderboard",
                href: "/dashboard/leaderboard",
                icon: Trophy,
            },
            {
                name: "Trading System",
                href: "/dashboard/trading-systems",
                icon: Bot,
            },
            {
                name: "Copy Trading",
                href: "/dashboard/copy-trading",
                icon: Copy,
                featureFlag: "feature_copy_trading",
            },
        ],
    },
];

// Admin mobile bottom tab bar groups
export const adminMenuGroups = [
    {
        label: "Monitor",
        icon: LayoutDashboard,
        items: [
            { name: "Overview", href: "/admin", icon: LayoutDashboard },

            { name: "AI Gateway", href: "/admin/ai", icon: Bot },
            {
                name: "Release Health",
                href: "/admin/release-health",
                icon: HeartPulse,
            },
            { name: "Reports", href: "/admin/reports", icon: FileBarChart },
            { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
            { name: "Security", href: "/admin/security", icon: ShieldAlert },
        ],
    },
    {
        label: "Content",
        icon: FileText,
        items: [
            { name: "Articles", href: "/admin/articles", icon: FileText },
            {
                name: "Article Ops",
                href: "/admin/articles/ops",
                icon: ClipboardCheck,
            },
            {
                name: "Shortcuts",
                href: "/admin/articles/shortcuts",
                icon: Bookmark,
            },
            { name: "Comments", href: "/admin/comments", icon: MessageSquare },
            { name: "Taxonomy", href: "/admin/taxonomy", icon: FolderTree },
            { name: "Quotes", href: "/admin/quotes", icon: Quote },
        ],
    },
    {
        label: "IB",
        icon: Users,
        items: [
            { name: "IB Overview", href: "/admin/ib", icon: TrendingUp },
            { name: "VIP Pipeline", href: "/admin/ib/pipeline", icon: Crown },
            {
                name: "Trader Monitor (CRM)",
                href: "/admin/ib/traders",
                icon: UserCheck,
            },
            { name: "Users", href: "/admin/users", icon: Users },
        ],
    },
    {
        label: "More",
        icon: MoreHorizontal,
        items: [
            { name: "Academy", href: "/admin/academy", icon: GraduationCap },
            { name: "Copy Trading", href: "/admin/copy-trading", icon: Copy },
            { name: "Trading Systems", href: "/admin/trading-systems", icon: Bot },
            { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
            { name: "Settings", href: "/admin/settings", icon: Settings },
            { name: "Email Lab", href: "/admin/email-lab", icon: Mail },
        ],
    },
];
