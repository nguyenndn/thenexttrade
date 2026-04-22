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
                    <div className="col-span-1 md:col-span-2 text-center py-20 bg-gray-50/50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/10 dark:to-white/5 mb-6">
                            <BarChart2 size={32} className="text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 font-medium">No trading systems found.</p>
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
