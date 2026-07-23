"use client";

import React, { useState } from "react";
import { Search, Filter, ChevronDown, ChevronUp, RotateCw } from "lucide-react";
import { format } from "date-fns";
import { getAiRequests } from "@/actions/admin/ai-gateway";

function formatRequestId(requestId: string): string {
    if (!requestId) return "-";
    if (requestId.length <= 45) return requestId;
    return `${requestId.slice(0, 38)}...`;
}

export function AiRequestsExplorer({ requests: initialRequests }: { requests: any[] }) {
    const [requestsList, setRequestsList] = useState(initialRequests);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const fresh = await getAiRequests(100);
            setRequestsList(fresh);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Failed to refresh requests:", err);
        } finally {
            setIsRefreshing(false);
        }
    };

    const filtered = requestsList.filter(
        (req) =>
            req.requestId.includes(searchTerm) ||
            (req.taskKey && req.taskKey.includes(searchTerm)) ||
            (req.user?.email && req.user.email.includes(searchTerm))
    );

    return (
        <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search request ID, task key, or user..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary text-gray-900 dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <span className="text-xs text-gray-500 font-medium">
                        Updated {format(lastUpdated, "HH:mm:ss")}
                    </span>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 px-3.5 py-2 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-sm font-medium h-[38px] disabled:opacity-50"
                    >
                        <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
                        <span>Refresh</span>
                    </button>
                    <button className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-sm font-medium h-[38px]">
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                    </button>
                </div>
            </div>

            {/* Data Table Card */}
            <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-500 font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-white/10">
                                    Request ID
                                </th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-white/10">
                                    Task Key
                                </th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-white/10">
                                    User
                                </th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-white/10">
                                    Status
                                </th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-white/10">
                                    Latency
                                </th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-white/10">
                                    Time
                                </th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-white/10 text-right">
                                    Details
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                            {filtered.map((req) => (
                                <React.Fragment key={req.id}>
                                    <tr className="group hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                                        <td
                                            className="px-6 py-4 font-mono text-xs text-gray-700 dark:text-gray-300 font-medium"
                                            title={req.requestId}
                                        >
                                            {formatRequestId(req.requestId)}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-semibold text-primary">
                                            {req.taskKey || "TRADE_ANALYSIS"}
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 dark:text-gray-300 font-medium">
                                            {req.user?.email || (
                                                <span className="text-gray-400 dark:text-gray-500 italic font-normal">
                                                    System
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                                                    req.status === "COMPLETED"
                                                        ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                                                        : req.status === "ERROR"
                                                          ? "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                                                          : "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                                                }`}
                                            >
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                                            {req.totalLatencyMs
                                                ? `${req.totalLatencyMs}ms`
                                                : "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                            {format(
                                                new Date(req.createdAt),
                                                "MMM d, HH:mm:ss"
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() =>
                                                    setExpandedId(
                                                        expandedId === req.id
                                                            ? null
                                                            : req.id
                                                    )
                                                }
                                                className="text-gray-400 hover:text-gray-950 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                            >
                                                {expandedId === req.id ? (
                                                    <ChevronUp className="w-4.5 h-4.5" />
                                                ) : (
                                                    <ChevronDown className="w-4.5 h-4.5" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>

                                    {expandedId === req.id && (
                                        <tr className="bg-gray-50/50 dark:bg-black/20">
                                            <td
                                                colSpan={7}
                                                className="px-6 py-4 border-l-2 border-primary"
                                            >
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-4 gap-4 text-xs">
                                                        <div>
                                                            <p className="text-gray-500 mb-1 font-semibold uppercase tracking-wider">
                                                                Full Request ID
                                                            </p>
                                                            <p className="font-mono text-gray-900 dark:text-gray-300 font-medium">
                                                                {req.requestId}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 mb-1 font-semibold uppercase tracking-wider">
                                                                Cost (USD)
                                                            </p>
                                                            <p className="font-mono text-primary font-bold">
                                                                $
                                                                {req.estimatedCostUsd?.toFixed(
                                                                    6
                                                                ) || "0.000000"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 mb-1 font-semibold uppercase tracking-wider">
                                                                Tokens
                                                            </p>
                                                            <p className="text-gray-900 dark:text-gray-300 font-medium">
                                                                In:{" "}
                                                                {req.inputTokens ||
                                                                    0}{" "}
                                                                / Out:{" "}
                                                                {req.outputTokens ||
                                                                    0}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 mb-1 font-semibold uppercase tracking-wider">
                                                                Routing Policy
                                                            </p>
                                                            <p className="text-gray-900 dark:text-gray-300 font-medium">
                                                                {req.routingPolicyId ||
                                                                    "Default"}{" "}
                                                                <span className="text-gray-500 font-normal">
                                                                    v
                                                                    {req.routingPolicyVersion ||
                                                                        1}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {req.attempts &&
                                                        req.attempts.length >
                                                            0 && (
                                                            <div>
                                                                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                                                                    Execution
                                                                    Attempts
                                                                </p>
                                                                <div className="space-y-2">
                                                                    {req.attempts.map(
                                                                        (
                                                                            attempt: any
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    attempt.id
                                                                                }
                                                                                className="flex items-center justify-between bg-white dark:bg-[#1E2028] rounded-xl p-3 border border-gray-200 dark:border-white/10 shadow-sm"
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <div
                                                                                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                                                                                            attempt.status ===
                                                                                            "COMPLETED"
                                                                                                ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400"
                                                                                                : attempt.status ===
                                                                                                    "ERROR"
                                                                                                  ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                                                                                                  : "bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400"
                                                                                        }`}
                                                                                    >
                                                                                        #
                                                                                        {
                                                                                            attempt.attemptNumber
                                                                                        }
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                                            {attempt.providerName ||
                                                                                                attempt.providerId ||
                                                                                                "Unknown Provider"}
                                                                                        </p>
                                                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                                                                                            {attempt.modelName ||
                                                                                                attempt.modelId ||
                                                                                                "Unknown Model"}{" "}
                                                                                            •{" "}
                                                                                            {
                                                                                                attempt.latencyMs
                                                                                            }
                                                                                            ms
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <span
                                                                                        className={`text-xs px-2 py-0.5 rounded-lg font-bold ${
                                                                                            attempt.httpStatus ===
                                                                                            200
                                                                                                ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                                                                                                : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                                                                                        }`}
                                                                                    >
                                                                                        HTTP{" "}
                                                                                        {attempt.httpStatus ||
                                                                                            "N/A"}
                                                                                    </span>
                                                                                    {attempt.errorMessageRedacted && (
                                                                                        <p
                                                                                            className="text-[10px] text-red-500 dark:text-red-400 mt-1 max-w-[200px] truncate"
                                                                                            title={
                                                                                                attempt.errorMessageRedacted
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                attempt.errorMessageRedacted
                                                                                            }
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}

                            {filtered.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-12 text-center text-sm text-gray-500"
                                    >
                                        No requests found matching your
                                        criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
