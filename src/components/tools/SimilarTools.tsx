import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ToolData } from "@/config/tools-data";

interface SimilarToolsProps {
    tools: ToolData[];
}

export function SimilarTools({ tools }: SimilarToolsProps) {
    if (tools.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
                <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 hover:border-primary/50 dark:hover:border-primary/30 transition-all duration-200 hover:shadow-md"
                >
                    <div className={`w-10 h-10 rounded-lg ${tool.iconBg} flex items-center justify-center shrink-0`}>
                        <tool.icon size={20} strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
                            {tool.shortTitle}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {tool.description}
                        </p>
                    </div>
                    <ArrowRight size={14} className="text-gray-400 group-hover:text-primary shrink-0 transition-colors" />
                </Link>
            ))}
        </div>
    );
}
