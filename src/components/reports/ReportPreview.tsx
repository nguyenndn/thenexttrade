"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReportPreviewProps {
    data: any;
    onDownload: () => void;
}

export function ReportPreview({ data, onDownload }: ReportPreviewProps) {
    if (!data) return null;

    return (
        <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    Report Preview
                </h3>
                <Button
                    onClick={onDownload}
                    className="flex items-center gap-2"
                >
                    <Download size={18} />
                    Download PDF
                </Button>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-primary/10 to-blue-500/10 p-6 rounded-xl mb-8 border border-primary/10">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded-full"></span>
                    Performance Summary: {data.period}
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Net P/L</p>
                        <p className={`text-2xl font-black ${data.summary.netPnL >= 0 ? 'text-primary' : 'text-red-500'}`}>
                            {data.summary.netPnL >= 0 ? '+' : ''}${data.summary.netPnL.toFixed(2)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Win Rate</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">
                            {data.summary.winRate.toFixed(0)}%
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Trades</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">
                            {data.summary.totalTrades}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Profit Factor</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">
                            {data.summary.profitFactor.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* By Strategy */}
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider text-gray-500">By Strategy</h4>
                    <div className="space-y-3">
                        {data.byStrategy.slice(0, 5).map((strat: any) => (
                            <div
                                key={strat.name}
                                className="flex justify-between items-center p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10"
                            >
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                                        {strat.name}
                                    </span>
                                    <span className="text-xs text-gray-500">{strat.trades} trades</span>
                                </div>
                                <div className="text-right">
                                    <div className={`font-bold ${strat.pnl >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                        {strat.pnl >= 0 ? '+' : ''}${strat.pnl.toFixed(0)}
                                    </div>
                                    <div className="text-xs text-gray-500">{strat.winRate.toFixed(0)}% WR</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* By Pair */}
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider text-gray-500">Top Pairs</h4>
                    <div className="space-y-3">
                        {data.byPair.slice(0, 5).map((pair: any) => (
                            <div
                                key={pair.symbol}
                                className="flex justify-between items-center p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10"
                            >
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {pair.symbol}
                                </span>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="text-gray-500">{pair.trades} trades</span>
                                    <span className={`font-bold ${pair.pnl >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                        {pair.pnl >= 0 ? '+' : ''}${pair.pnl.toFixed(0)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Trades Table */}
            <div className="mt-8">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider text-gray-500">Recent Trades</h4>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase font-bold text-gray-500">
                            <tr>
                                <th className="px-4 py-3 text-left whitespace-nowrap">Date</th>
                                <th className="px-4 py-3 text-left whitespace-nowrap">Symbol</th>
                                <th className="px-4 py-3 text-left whitespace-nowrap">Type</th>
                                <th className="px-4 py-3 text-right whitespace-nowrap">Result</th>
                                <th className="px-4 py-3 text-right whitespace-nowrap">P/L</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {data.recentTrades?.length > 0 ? (
                                data.recentTrades.slice(0, 5).map((trade: any, i: number) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{trade.date}</td>
                                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white whitespace-nowrap">{trade.symbol}</td>
                                        <td className={`px-4 py-3 font-bold whitespace-nowrap ${trade.type === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>{trade.type}</td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <span className={`
                            px-2 py-1 rounded text-xs font-bold
                            ${trade.result === 'WIN' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                                                    trade.result === 'LOSS' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                                                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}
                          `}>
                                                {trade.result}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${trade.pnl >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No trades found in this period.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
