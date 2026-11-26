"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ExternalLink, Power, Building2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { EditEABrokerModal } from "./EditEABrokerModal";
import { CommissionRatesTab, type CommissionRateItem } from "./CommissionRatesTab";

interface EABroker {
    id: string;
    name: string;
    slug: string;
    logo: string;
    affiliateUrl: string | null;
    ibCode: string | null;
    color: string;
    isActive: boolean;
    order: number;
}

interface EABrokersTabsClientProps {
    brokers: EABroker[];
    commissionRates: CommissionRateItem[];
}

export function EABrokersTabsClient({
    brokers,
    commissionRates,
}: EABrokersTabsClientProps) {
    const [activeTab, setActiveTab] = useState("brokers");

    const countBadgeClass = (isActive: boolean) =>
        isActive
            ? "text-[11px] px-2 py-0.5 rounded-lg font-bold tabular-nums transition-colors bg-white/20 text-white"
            : "text-[11px] px-2 py-0.5 rounded-lg font-bold tabular-nums transition-colors bg-gray-200/80 text-gray-600 dark:bg-white/10 dark:text-gray-300";

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-1 gap-1">
                    <TabsTrigger
                        value="brokers"
                        className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
                        activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md shadow-amber-500/20 border-0"
                        activeTextClassName="!text-white"
                    >
                        <Building2
                            size={15}
                            className={
                                activeTab === "brokers"
                                    ? "text-white"
                                    : "text-gray-400 dark:text-gray-500"
                            }
                        />
                        <span>Partner Brokers</span>
                        <span className={countBadgeClass(activeTab === "brokers")}>
                            {brokers.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="rates"
                        className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
                        activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md shadow-amber-500/20 border-0"
                        activeTextClassName="!text-white"
                    >
                        <DollarSign
                            size={15}
                            className={
                                activeTab === "rates"
                                    ? "text-white"
                                    : "text-gray-400 dark:text-gray-500"
                            }
                        />
                        <span>Commission Rates</span>
                        <span className={countBadgeClass(activeTab === "rates")}>
                            {commissionRates.length}
                        </span>
                    </TabsTrigger>
                </TabsList>

                {activeTab === "brokers" && (
                    <Link href="/admin/trading-systems/brokers/create">
                        <Button
                            variant="primary"
                            className="shadow-lg shadow-amber-500/30 shrink-0"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            Add EA Broker
                        </Button>
                    </Link>
                )}
            </div>

            {/* TAB 1: Partner Brokers */}
            <TabsContent value="brokers" className="space-y-4 outline-hidden">
                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden overflow-x-auto shadow-sm hover:shadow-md transition-shadow">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-white/5 text-left">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                                    Order
                                </th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                                    Broker
                                </th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                                    Slug
                                </th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                                    IB Link
                                </th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                            {brokers?.map((broker) => (
                                <tr
                                    key={broker.id}
                                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <td className="p-4">
                                        <span className="text-sm font-mono tabular-nums text-gray-500">
                                            {broker.order}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-white p-1 border border-gray-200 dark:border-white/10 flex items-center justify-center">
                                                <img
                                                    src={broker.logo}
                                                    alt={broker.name}
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                            <div>
                                                <div className="font-bold dark:text-white">
                                                    {broker.name}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className="w-2.5 h-2.5 rounded-full inline-block"
                                                        style={{
                                                            backgroundColor:
                                                                broker.color,
                                                        }}
                                                    />
                                                    <span className="text-xs font-mono text-gray-500">
                                                        {broker.color}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <code className="text-xs bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg font-mono text-gray-600 dark:text-gray-300">
                                            {broker.slug}
                                        </code>
                                    </td>
                                    <td className="p-4">
                                        {broker.affiliateUrl ? (
                                            <Link
                                                href={broker.affiliateUrl}
                                                target="_blank"
                                                className="text-xs text-primary hover:underline flex items-center gap-1 max-w-[200px] truncate"
                                            >
                                                <ExternalLink size={12} />
                                                {broker.affiliateUrl
                                                    .replace(/^https?:\/\//, "")
                                                    .substring(0, 30)}
                                                ...
                                            </Link>
                                        ) : (
                                            <span className="text-xs text-gray-500">
                                                No link
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {broker.isActive ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                                                <Power size={10} /> Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-1 rounded-lg">
                                                <Power size={10} /> Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <EditEABrokerModal broker={broker} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!brokers || brokers.length === 0) && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="p-8 text-center text-gray-600"
                                    >
                                        No EA brokers found. Add your first partner!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </TabsContent>

            {/* TAB 2: Commission Rates */}
            <TabsContent value="rates" className="space-y-4 outline-hidden">
                <CommissionRatesTab
                    initialRates={commissionRates}
                    availableBrokers={brokers.map((b) => ({ id: b.id, name: b.name, slug: b.slug }))}
                />
            </TabsContent>
        </Tabs>
    );
}
