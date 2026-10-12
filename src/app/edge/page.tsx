import { Metadata } from "next";
import { Target } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getAuthUser } from "@/lib/auth-cache";
import { EdgeInfoContent } from "@/components/gamification/EdgeInfoContent";

export const metadata: Metadata = {
    title: "About Edge",
    description: "Learn about the Edge gamification system on TheNextTrade.",
};

export default async function EdgePublicPage() {
    const user = await getAuthUser();

    return (
        <main className="min-h-screen bg-white dark:bg-transparent flex flex-col relative overflow-hidden">
            {/* Ambient Background Atmosphere & Technical Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.08),transparent_75%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.12),transparent_75%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />
            <PublicHeader user={user} />

            <div className="flex-1 pt-24 pb-10 sm:pb-16 relative z-10 px-4 sm:px-6 lg:px-8">
                {/* Hero Header matching legal pages style */}
                <div className="max-w-3xl mx-auto text-center space-y-6 mb-10 sm:mb-16 mt-8">
                    <div className="inline-flex items-center justify-center p-3 rounded-lg bg-amber-500/10 text-amber-500 mb-2 ring-4 ring-amber-500/5 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500">
                        <Target size={40} strokeWidth={1.5} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-700 dark:text-white leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700">
                        About Edge Gamification
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        The measure of your consistency, discipline, and
                        commitment to improvement.
                    </p>
                </div>

                {/* Content Container matching legal pages style */}
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-[#1E2028] border border-dashboard rounded-lg p-6 sm:p-8 md:p-14 shadow-xl transition-colors duration-300 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        {/* 
 Since EdgeInfoContent has its own borders and backgrounds (like bg-[#15171E]), 
 it will render as inner cards within this master container, which creates 
 a very nice depth effect.
 */}
                        <EdgeInfoContent />
                    </div>
                </div>
            </div>

            <SiteFooter />
        </main>
    );
}
