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
    {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        items: [
            { name: "Journal", href: "/dashboard/journal" },
            { name: "Sessions", href: "/dashboard/sessions" },
            { name: "Trading Accounts", href: "/dashboard/accounts" },
        ]
    },
    {
        name: "Analysis",
        href: "#",
        icon: BarChart3,
        items: [
            { name: "Analytics", href: "/dashboard/analytics" },
            { name: "Reports", href: "/dashboard/reports" },
            { name: "Mistakes", href: "/dashboard/mistakes" },
        ]
    },
    {
        name: "Strategy",
        href: "#",
        icon: Target,
        items: [
            { name: "Playbook", href: "/dashboard/playbook" },
            { name: "Strategies", href: "/dashboard/strategies" },
            { name: "Psychology", href: "/dashboard/psychology" },
            { name: "Trading Systems", href: "/dashboard/trading-systems" },
        ]
    },
    {
        name: "Resources",
        href: "#",
        icon: BookOpen,
        items: [
            { name: "Academy", href: "/dashboard/academy" },
        ]
    }
];

export const adminMenuItems = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Articles", href: "/admin/articles", icon: FileText },
    { name: "Comments", href: "/admin/comments", icon: MessageSquare },
    { name: "Categories", href: "/admin/categories", icon: List },
    { name: "Tags", href: "/admin/tags", icon: Tag },
    { name: "Brokers", href: "/admin/brokers", icon: Briefcase },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Academy", href: "/admin/academy", icon: GraduationCap },
    { name: "Quizzes", href: "/admin/quizzes", icon: ListChecks },
    { name: "AI Studio", href: "/admin/ai-studio", icon: Sparkles },
    { name: "EA Management", href: "/admin/ea", icon: Bot },
    { name: "System Logs", href: "/admin/system/logs", icon: Activity },
    { name: "Settings", href: "/admin/settings", icon: Settings },
];
