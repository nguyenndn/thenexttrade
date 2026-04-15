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
    Shield,
    MessageCircle,
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
    },
    {
        name: "Accounts & Props",
        href: "/dashboard/accounts",
        icon: Wallet,
    },

    // --- EXECUTION ---
    {
        name: "Trading Journal",
        href: "/dashboard/journal",
        icon: FileText,
    },
    {
        name: "Strategies",
        href: "/dashboard/strategies",
        icon: Route,
    },

    // --- REVIEW ---
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

    // --- RESOURCES ---
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
        name: "EA & Indicators",
        href: "/dashboard/trading-systems",
        icon: Bot,
    },
    {
        name: "Community",
        href: "/dashboard/community",
        icon: MessageCircle,
    },

    // --- INVESTING ---
    {
        name: "Copy Trading",
        href: "/dashboard/copy-trading",
        icon: Copy,
    },
    {
        name: "Funded Challenge",
        href: "/dashboard/funded-challenge",
        icon: Shield,
        featureFlag: "feature_funded_challenge",
    }
];

export const adminMenuItems = [
    // --- (No label — first item) ---
    { name: "Overview", href: "/admin", icon: LayoutDashboard },

    // --- CONTENT ---
    { name: "Articles", href: "/admin/articles", icon: FileText },
    { name: "Shortcuts", href: "/admin/articles/shortcuts", icon: Bookmark },
    { name: "Comments", href: "/admin/comments", icon: MessageSquare },
    { name: "Taxonomy", href: "/admin/taxonomy", icon: FolderTree },
    { name: "Quotes", href: "/admin/quotes", icon: Quote },

    // --- EDUCATION ---
    { name: "Academy", href: "/admin/academy", icon: GraduationCap },

    // --- COMMUNITY ---
    { name: "Community", href: "/admin/community", icon: MessageCircle },

    // --- INVESTING ---
    { name: "Copy Trading", href: "/admin/copy-trading", icon: Copy },
    { name: "Funded Challenge", href: "/admin/funded-challenge", icon: Shield },

    // --- SYSTEM ---
    { name: "EA Management", href: "/admin/ea", icon: Bot },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
    { name: "Settings", href: "/admin/settings", icon: Settings },
];

// Mobile bottom tab bar groups (first 3 groups + "More" for remainder)
export const dashboardMenuGroups = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        items: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { name: "Accounts & Props", href: "/dashboard/accounts", icon: Wallet },
        ],
    },
    {
        label: "Journal",
        icon: FileText,
        items: [
            { name: "Trading Journal", href: "/dashboard/journal", icon: FileText },
            { name: "Strategies", href: "/dashboard/strategies", icon: Route },
        ],
    },
    {
        label: "Analytics",
        icon: BarChart3,
        items: [
            { name: "Analytics Hub", href: "/dashboard/analytics", icon: BarChart3 },
            { name: "Psychology", href: "/dashboard/psychology", icon: Activity },
        ],
    },
    {
        label: "More",
        icon: MoreHorizontal,
        items: [
            { name: "Academy", href: "/dashboard/academy", icon: GraduationCap },
            { name: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
            { name: "EA & Indicators", href: "/dashboard/trading-systems", icon: Bot },
            { name: "Community", href: "/dashboard/community", icon: MessageCircle },
            { name: "Copy Trading", href: "/dashboard/copy-trading", icon: Copy },
            { name: "Funded Challenge", href: "/dashboard/funded-challenge", icon: Shield, featureFlag: "feature_funded_challenge" },
        ],
    },
];
