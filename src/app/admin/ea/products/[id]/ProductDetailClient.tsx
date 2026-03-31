"use client";

import { useRouter } from "next/navigation";
import { Download, Users, Zap, Activity } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EditProductView } from "@/components/admin/ea/EditProductView";

interface ProductDetailClientProps {
    product: any;
}

const TYPE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
    AUTO_TRADE: { label: "Auto Trade", color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20", icon: Zap },
    MANUAL_ASSIST: { label: "Manual Assist", color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20", icon: Activity },
    INDICATOR: { label: "Indicator", color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20", icon: Activity },
};

export function ProductDetailClient({ product }: ProductDetailClientProps) {
    const typeInfo = TYPE_LABELS[product.type] || TYPE_LABELS.AUTO_TRADE;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <AdminPageHeader
                title={product.name}
                description={`${typeInfo.label} · v${product.version} · ${product.isActive ? "Active" : "Inactive"}`}
                backHref="/admin/ea/products"
            />

            {/* Edit Form - same layout as Create page */}
            <EditProductView product={product} />

            {/* Recent Downloads */}
            <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        Recent Downloads
                    </h3>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                        {product._count?.downloads || 0} total
                    </span>
                </div>

                {product.downloads && product.downloads.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {product.downloads.map((dl: any) => (
                            <div key={dl.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                                        {dl.user?.image ? (
                                            <img src={dl.user.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                        ) : (
                                            <Users size={14} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                            {dl.user?.name || dl.user?.email || "Unknown"}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-medium">
                                            v{dl.version} · {dl.platform}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                    {new Date(dl.createdAt).toLocaleDateString("en-GB", {
                                        day: "2-digit", month: "short",
                                    })}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Download size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-sm text-gray-400">No downloads yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
