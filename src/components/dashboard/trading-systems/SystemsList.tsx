"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Download, Star, Shield, Info, BarChart2, Bot, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { cn } from "@/lib/utils";
import { EAProduct } from "@prisma/client";

import { SystemDetailCard } from "./SystemDetailCard";

interface SystemsListProps {
    products: EAProduct[];
    isLocked: boolean;
}

export function SystemsList({ products, isLocked }: SystemsListProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Search Toolbar */}
            <div className="bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
                <div className="w-full sm:max-w-md">
                    <PremiumInput
                        icon={Search}
                        placeholder="Search trading systems..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredProducts.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 text-center py-16 bg-white dark:bg-[#1E2028] rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10">
                        {/* Animated Bot Icon */}
                        <div className="relative w-20 h-20 mb-6 mx-auto">
                            <div className="absolute inset-0 rounded-full bg-primary/10 dark:bg-primary/5 animate-[systems-ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
                            <div className="relative w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center animate-[systems-float_3s_ease-in-out_infinite]">
                                <BarChart2 size={32} className="text-gray-500 dark:text-gray-300" strokeWidth={1.5} />
                                {/* Sparkle dots */}
                                <div className="absolute -top-2 left-3 w-1.5 h-1.5 rounded-full bg-primary/40 animate-[systems-sparkle_2.5s_ease-in-out_infinite_1.2s]" />
                                <div className="absolute -bottom-1 -right-1 w-1 h-1 rounded-full bg-primary/30 animate-[systems-sparkle_3s_ease-in-out_infinite_0.8s]" />
                                <div className="absolute top-0 -right-2 w-1 h-1 rounded-full bg-primary/25 animate-[systems-sparkle_2s_ease-in-out_infinite_1.5s]" />
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">
                            No Trading Systems Found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 px-6 max-w-sm mx-auto mb-6">
                            No trading systems match your search. Try a different keyword or check back later for new releases.
                        </p>

                        <style jsx>{`
                            @keyframes systems-float {
                                0%, 100% { transform: translateY(0px); }
                                50% { transform: translateY(-6px); }
                            }
                            @keyframes systems-ping {
                                0% { transform: scale(1); opacity: 0.3; }
                                75%, 100% { transform: scale(1.3); opacity: 0; }
                            }
                            @keyframes systems-sparkle {
                                0%, 100% { opacity: 0; transform: scale(0); }
                                50% { opacity: 1; transform: scale(1); }
                            }
                        `}</style>
                    </div>
                ) : (
                    filteredProducts.map(product => (
                        <SystemDetailCard
                            key={product.id}
                            product={product}
                            isLocked={isLocked}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
