import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Loading | Admin",
};

export default function Loading() {
    return (
        <div className="space-y-6 pb-10 animate-in fade-in max-w-full">
            {/* Admin Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-white/10 pb-8">
               <div className="space-y-3">
                   <div className="flex items-center gap-3">
                       <div className="w-1.5 h-8 bg-gray-200 dark:bg-white/5 rounded-full animate-pulse" />
                       <div className="h-8 w-48 bg-gray-200 dark:bg-white/5 rounded-xl animate-pulse" />
                   </div>
                   <div className="h-4 w-64 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse ml-4.5" />
               </div>
               <div className="h-10 w-32 bg-gray-200 dark:bg-white/5 rounded-xl animate-pulse" />
            </div>
            
            {/* Toolbar Card Skeleton */}
            <div className="h-16 bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-100 dark:border-white/10 animate-pulse mb-6" />

            {/* Table Card Skeleton */}
            <div className="h-96 bg-white dark:bg-[#151925] rounded-xl border border-gray-100 dark:border-white/10 flex flex-col p-4 animate-pulse">
                <div className="h-10 w-full bg-gray-100 dark:bg-white/5 rounded-xl mb-4" />
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 w-full bg-gray-50 dark:bg-white/5 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}
