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
    ListChecks,
    Activity,
    Tag,
    MessageSquare,
    Briefcase,
    Sparkles,
    Bot,
    Download,
    BarChart3,
    Target,
    AlertTriangle,
    FileSpreadsheet,
    Clock,
    Route,
    Zap
} from "lucide-react";

export const menuItems = [
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
        type: "dropdown" as const,
        items: [
            { name: "Risk Calculator", href: "/tools/risk-calculator" },
            { name: "Market Hours", href: "/tools/market-hours" },
            { name: "Economic Calendar", href: "/tools/economic-calendar" },
        ],
    },
    {
        name: "Brokers",
        href: "/brokers",
        type: "link" as const,
    },
];

export const dashboardMenuItems = [
    // --- BƯỚC 1: VẬN HÀNH (OPERATIONS) ---
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

    // --- BƯỚC 2: TÁC CHIẾN (EXECUTION) ---
    {
        name: "Trading Journal",
        href: "/dashboard/journal",
        icon: FileText,
    },
    {
        name: "Sessions",
        href: "/dashboard/sessions",
        icon: Clock,
    },
    {
        name: "Strategies",
        href: "/dashboard/strategies",
        icon: Route,
    },
    {
        name: "The Playbook",
        href: "/dashboard/playbook",
        icon: Target,
    },

    // --- BƯỚC 3: KIỂM ĐIỂM (REVIEW) ---
    {
        name: "Analytics Hub",
        href: "/dashboard/analytics",
        icon: BarChart3,
    },
    {
        name: "Reports",
        href: "/dashboard/reports",
        icon: FileSpreadsheet,
    },
    {
        name: "Mistakes",
        href: "/dashboard/mistakes",
        icon: AlertTriangle,
    },
    {
        name: "Psychology",
        href: "/dashboard/psychology",
        icon: Activity,
    },

    // --- BƯỚC 4: TÀI NGUYÊN (RESOURCES) ---
    {
        name: "Academy",
        href: "/dashboard/academy",
        icon: GraduationCap,
    },
    {
        name: "EA & Indicators",
        href: "/dashboard/trading-systems",
        icon: Bot,
    }
];

export const adminMenuItems = [
    // --- (No label — first item) ---
    { name: "Overview", href: "/admin", icon: LayoutDashboard },

    // --- CONTENT ---
    { name: "Articles", href: "/admin/articles", icon: FileText },
    { name: "Shortcuts", href: "/admin/articles/shortcuts", icon: Zap },
    { name: "Comments", href: "/admin/comments", icon: MessageSquare },
    { name: "Categories", href: "/admin/categories", icon: List },
    { name: "Tags", href: "/admin/tags", icon: Tag },

    // --- EDUCATION ---
    { name: "Academy", href: "/admin/academy", icon: GraduationCap },
    { name: "Quizzes", href: "/admin/quizzes", icon: ListChecks },
    { name: "AI Studio", href: "/admin/ai-studio", icon: Sparkles },

    // --- SYSTEM ---
    { name: "EA Management", href: "/admin/ea", icon: Bot },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Brokers", href: "/admin/brokers", icon: Briefcase },
    { name: "System Logs", href: "/admin/system/logs", icon: Activity },
    { name: "Settings", href: "/admin/settings", icon: Settings },
];
