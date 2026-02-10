import Link from 'next/link';
import { getBrokers, deleteBroker } from '@/app/actions/brokers';
import { Briefcase, Plus, Star, Globe, Trash2, Edit } from 'lucide-react';
import { CreateBrokerButton } from './CreateBrokerButton';

export default async function AdminBrokersPage() {
    const { data: brokers } = await getBrokers();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                        <Briefcase className="text-primary" />
                        Brokers Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage verified partners and broker reviews.</p>
                </div>
                <CreateBrokerButton />
            </div>

            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-white/5 text-left">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Broker</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Rating</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Features</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {brokers?.map((broker: any) => (
                            <tr key={broker.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white p-1 border border-gray-100 flex items-center justify-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={broker.logo} alt={broker.name} className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <div>
                                            <div className="font-bold dark:text-white">{broker.name}</div>
                                            <div className="text-xs text-gray-500">{broker.slug}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1 text-yellow-500 font-bold">
                                        <Star size={14} fill="currentColor" />
                                        {broker.rating}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {broker.features.slice(0, 2).map((feat: string, i: number) => (
                                            <span key={i} className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-white/10 rounded-full dark:text-gray-300">
                                                {feat}
                                            </span>
                                        ))}
                                        {broker.features.length > 2 && (
                                            <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-white/10 rounded-full text-gray-400">
                                                +{broker.features.length - 2}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4">
                                    {broker.isRecommended && (
                                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded inline-block mr-2">
                                            Recommended
                                        </span>
                                    )}
                                    {broker.isVisible ? (
                                        <span className="text-xs text-blue-500">Visible</span>
                                    ) : (
                                        <span className="text-xs text-gray-500">Hidden</span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link href={`/admin/brokers/${broker.id}`} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg">
                                            <Edit size={16} />
                                        </Link>
                                        <Link href={broker.affiliateUrl || '#'} target="_blank" className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 rounded-lg">
                                            <Globe size={16} />
                                        </Link>
                                        {/* Delete Button (Ideally client component for interactivity, keeping simple here or would use form action) */}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!brokers || brokers.length === 0) && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    No brokers found. Add your first partner!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
