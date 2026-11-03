import Link from "next/link";
import { getTierProgress } from "@/lib/tier-utils";

interface UserMenuProfileHeaderProps {
    name: string;
    tierProgress: ReturnType<typeof getTierProgress>;
    onClose: () => void;
}

export function UserMenuProfileHeader({
    name,
    tierProgress,
    onClose,
}: UserMenuProfileHeaderProps) {
    return (
        <div className="p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
            <h4 className="font-bold text-lg text-gray-700 dark:text-white leading-tight">
                Hello, <span className="text-primary">{name}</span>
            </h4>

            {/* Rank & Tier Link to Leaderboard */}
            <Link
                href="/dashboard/leaderboard?type=mystats"
                className="mt-3 flex items-center gap-2 hover:opacity-80 transition-opacity w-full text-left"
                onClick={onClose}
            >
                <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                    style={{
                        color: tierProgress.current.color,
                        borderColor: tierProgress.current.color + "40",
                        backgroundColor: tierProgress.current.color + "15",
                    }}
                >
                    {tierProgress.current.label}
                </span>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                    {tierProgress.current.label} Rank
                </span>
            </Link>

            {/* Progress bar */}
            {tierProgress.next && (
                <div className="mt-2">
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${tierProgress.progress}%`,
                                backgroundColor: tierProgress.current.color,
                            }}
                        />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                        {tierProgress.xpToNext.toLocaleString()} Edge to{" "}
                        {tierProgress.next.label}
                    </p>
                </div>
            )}
        </div>
    );
}
