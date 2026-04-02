"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Download, Star, Shield, Info, BarChart2, Bot, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
            {/* Search Box */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-focus-within:text-primary transition-colors"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <input
                    type="text"
                    placeholder="Search trading systems..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 h-[52px] bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none text-gray-700 dark:text-white transition-all shadow-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
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
