"use client";

import { BarChart3, Crown, Users } from "lucide-react";
import { TabBar } from "@/components/ui/TabBar";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const tabs = [
    { label: "Overview", href: "/admin/ib", icon: BarChart3 },
    { label: "VIP Pipeline", href: "/admin/ib/pipeline", icon: Crown },
    { label: "Trader Monitor (CRM)", href: "/admin/ib/traders", icon: Users },
];

export default function IbOperationsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="Partner Pro Operations"
                description="Control the partner funnel from broker click to approved Pro user and real trading activity."
            />

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
