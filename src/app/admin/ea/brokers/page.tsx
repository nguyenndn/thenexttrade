import Link from "next/link";
import { Plus, ExternalLink, Power } from "lucide-react";
import { getEABrokers } from "./actions";
import { Button } from "@/components/ui/Button";
import { EditEABrokerModal } from "./EditEABrokerModal";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default async function EABrokersPage() {
    const { data: brokers } = await getEABrokers();

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="EA Brokers"
                description="Manage supported brokers and affiliate links."
                backHref="/admin/ea"
            >
                <Link href="/admin/ea/brokers/create">
                    <Button variant="primary" className="shadow-lg shadow-primary/30">
                        <Plus size={18} strokeWidth={2.5} />
                        Add EA Broker
                    </Button>
                </Link>
            </AdminPageHeader>

            {/* Table */}
            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-white/5 text-left">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Order</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Broker</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Slug</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">IB Link</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                        {brokers?.map((broker: any) => (
                            <tr key={broker.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <span className="text-sm font-mono text-gray-400">{broker.order}</span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white p-1 border border-gray-100 dark:border-white/10 flex items-center justify-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={broker.logo} alt={broker.name} className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <div>
                                            <div className="font-bold dark:text-white">{broker.name}</div>
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full inline-block"
                                                    style={{ backgroundColor: broker.color }}
                                                />
                                                <span className="text-xs text-gray-400">{broker.color}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <code className="text-xs bg-gray-100 dark:bg-white/5 px-2 py-1 rounded font-mono text-gray-600 dark:text-gray-300">
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
                                            {broker.affiliateUrl.replace(/^https?:\/\//, "").substring(0, 30)}...
                                        </Link>
                                    ) : (
                                        <span className="text-xs text-gray-400">No link</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {broker.isActive ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                                            <Power size={10} /> Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full">
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
                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                    No EA brokers found. Add your first partner!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
