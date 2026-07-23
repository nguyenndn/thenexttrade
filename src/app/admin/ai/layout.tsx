"use client";

import { BarChart3, Cpu, Route, Activity, History, Plus, Box } from "lucide-react";
import { TabBar } from "@/components/ui/TabBar";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { usePathname, useRouter } from "next/navigation";

const tabs = [
    { label: "Overview", href: "/admin/ai", icon: BarChart3 },
    { label: "Providers & Keys", href: "/admin/ai/providers", icon: Cpu },
    { label: "Model Catalog", href: "/admin/ai/models", icon: Box },
    { label: "Routing Policies", href: "/admin/ai/routes", icon: Route },
    { label: "Requests Explorer", href: "/admin/ai/requests", icon: Activity },
    { label: "Audit Log", href: "/admin/ai/audit", icon: History },
];

export default function AiGatewayLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="AI Gateway Control Panel"
                description="Configure models, rotate API keys, design routing rules, and monitor requests."
            >
                {pathname === "/admin/ai/routes" && (
                    <button
                        onClick={() => router.push("/admin/ai/routes?add=true")}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl flex items-center text-sm font-semibold transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Create Policy
                    </button>
                )}
            </AdminPageHeader>

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="overflow-x-auto scrollbar-hide flex">
                        <TabBar tabs={tabs} className="shrink-0" />
                    </div>
                </div>

                {/* Content */}
                <div className="mt-4">{children}</div>
            </div>
        </div>
    );
}
