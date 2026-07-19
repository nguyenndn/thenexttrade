import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface ReportSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    actionHref?: string;
    actionLabel?: string;
}

export function ReportSection({
    title,
    description,
    children,
    actionHref,
    actionLabel,
}: ReportSectionProps) {
    return (
        <section className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-6 md:p-8 group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-base font-bold text-gray-800 dark:text-white">
                        {title}
                    </h2>
                    {description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {description}
                        </p>
                    )}
                </div>
                {actionHref && (
                    <Link
                        href={actionHref}
                        className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
                    >
                        {actionLabel || "View All"}
                        <ArrowUpRight size={12} />
                    </Link>
                )}
            </div>
            {children}
        </section>
    );
}
