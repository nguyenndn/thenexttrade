import Link from "next/link";
import { AlertTriangle, Clock, ChevronRight, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PendingItem {
    id: string;
    title: string;
    type: "ARTICLE" | "REPORT" | "CONTACT";
    createdAt: Date;
    author?: string;
}

export function PendingActionsWidget({ items }: { items: PendingItem[] }) {
    return (
        <div className="bg-white dark:bg-[#0B0E14] border border-gray-100 dark:border-white/5 rounded-xl p-6 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Actions Required
                {items.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-xs px-2 py-0.5 rounded-full">
                        {items.length}
                    </span>
                )}
            </h3>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 gap-2 min-h-[150px]">
                        <CheckCircle2 className="w-8 h-8 opacity-20" />
                        <p className="text-sm">Todo list is empty. Great job!</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div 
                            key={item.id} 
                            className="group flex items-start gap-3 p-3 rounded-xl border border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/5 hover:border-amber-200 dark:hover:border-amber-500/30 transition-all cursor-pointer"
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                item.type === "ARTICLE" ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" :
                                item.type === "REPORT" ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" :
                                "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
                            )}>
                                <FileText className="w-4 h-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-gray-700 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                                    {item.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    {item.author && (
                                        <>
                                            <span className="text-gray-300 dark:text-gray-600">•</span>
                                            <span className="text-xs text-gray-600 dark:text-gray-300">by {item.author}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    ))
                )}
            </div>

            {items.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
                    <Link 
                        href="/admin/articles?status=pending" 
                        className="text-sm text-amber-600 dark:text-amber-500 font-medium hover:underline flex items-center justify-center"
                    >
                        View all pending items
                    </Link>
                </div>
            )}
        </div>
    );
}
