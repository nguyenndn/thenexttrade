export interface AdminLesson {
    id: string;
    title: string;
    slug: string;
    order: number;
    status: string;
    duration?: number | null;
}

export interface AdminModule {
    id: string;
    title: string;
    order: number;
    quiz?: { id: string } | null;
    _count?: { lessons: number };
    lessons: AdminLesson[];
}

export interface AdminLevel {
    id: string;
    title: string;
    description?: string | null;
    order: number;
    accessLevel?: string;
    _count?: { modules: number };
    modules: AdminModule[];
}

export type ViewMode = "grid" | "table" | "tree";
export type AccessFilter = "ALL" | "PUBLIC" | "MEMBER";
export type SortOption =
    | "ORDER_ASC"
    | "ORDER_DESC"
    | "LESSONS_DESC"
    | "MODULES_DESC"
    | "TITLE_ASC";

export function getStageForLevel(order: number): {
    name: string;
    badgeClass: string;
} {
    if (order <= 2) {
        return {
            name: "The Initiate",
            badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        };
    }
    if (order <= 5) {
        return {
            name: "The Analyst",
            badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
        };
    }
    if (order === 6 || order === 8) {
        return {
            name: "The Strategist",
            badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        };
    }
    if (order === 7 || order <= 10) {
        return {
            name: "The Operator",
            badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        };
    }
    return {
        name: "The Master",
        badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    };
}
