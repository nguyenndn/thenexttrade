import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AdminPageHeaderProps {
    title: string;
    description: string;
    backHref?: string;
    children?: React.ReactNode;
}

export function AdminPageHeader({ title, description, backHref, children }: AdminPageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
                {backHref && (
                    <Link
                        href={backHref}
                        className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors shrink-0"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </Link>
                )}
                {/* Gradient Bar */}
                <div className="w-1 self-stretch min-h-[40px] rounded-full bg-gradient-to-b from-primary via-emerald-400 to-teal-500 shrink-0" />
                <div>
                    <h1 className="text-xl font-bold text-gray-700 dark:text-white tracking-tight">
                        {title}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                        {description}
                    </p>
                </div>
            </div>
            {children && (
                <div className="flex items-center gap-3">
                    {children}
                </div>
            )}
        </div>
    );
}

