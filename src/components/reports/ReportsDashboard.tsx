"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { toast } from "sonner";
import {
    FileText,
    Download,
    FileSpreadsheet,
    Calendar,
    TrendingUp,
} from "lucide-react";
import { ReportPreview } from "./ReportPreview";

interface ReportType {
    id: string;
    name: string;
    description: string;
    format: "pdf" | "csv";
    icon: any;
}

const REPORT_TYPES: ReportType[] = [
    {
        id: "monthly",
        name: "Monthly Performance",
        description: "Detailed PDF report with stats & charts",
        format: "pdf",
        icon: FileText,
    },
    {
        id: "trades",
        name: "Trade History Export",
        description: "Complete trade log for analysis",
        format: "csv",
        icon: FileSpreadsheet,
    },
    {
        id: "tax",
        name: "Tax Report",
        description: "P/L summary for tax filing",
        format: "csv",
        icon: TrendingUp,
    },
];

export function ReportsDashboard() {
    const now = new Date();
    const [selectedType, setSelectedType] = useState<string>("monthly");
    const [dateRange, setDateRange] = useState({
        start: startOfMonth(subMonths(now, 1)), // Default to last month
        end: endOfMonth(subMonths(now, 1)),
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);

    const selectedReport = REPORT_TYPES.find((r) => r.id === selectedType);

    const handleGenerate = async () => {
        try {
            setIsGenerating(true);

            if (selectedType === "trades" || selectedType === "tax") {
                // CSV download directly
                const params = new URLSearchParams({
                    type: selectedType,
                    startDate: format(dateRange.start, "yyyy-MM-dd"),
                    endDate: format(dateRange.end, "yyyy-MM-dd"),
                });

                const response = await fetch(`/api/export/csv?${params}`);
                if (!response.ok) throw new Error("Failed to generate CSV");

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${selectedType}_${format(dateRange.start, "yyyy-MM-dd")}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                toast.success("Descargado correctamente"); // "Downloaded successfully"
            } else {
                // PDF - fetch data first, then preview
                const params = new URLSearchParams({
                    startDate: format(dateRange.start, "yyyy-MM-dd"),
                    endDate: format(dateRange.end, "yyyy-MM-dd"),
                });

                const response = await fetch(`/api/export/report-data?${params}`);
                if (!response.ok) throw new Error("Failed to fetch report data");

                const data = await response.json();
                setPreviewData(data);
                toast.success("Ready to preview");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate report");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!previewData) return;
        try {
            const { generatePDF } = await import("@/lib/pdf-utils");
            await generatePDF(previewData);
            toast.success("PDF Downloaded");
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate PDF");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Report Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {REPORT_TYPES.map((report) => (
                    <button
                        key={report.id}
                        onClick={() => {
                            setSelectedType(report.id);
                            setPreviewData(null);
                        }}
                        className={`
              relative text-left p-6 rounded-[24px] border-2 transition-all duration-300 group
              ${selectedType === report.id
                                ? "border-[#00C888] bg-[#00C888]/5 shadow-xl shadow-[#00C888]/10 -translate-y-1"
                                : "border-gray-100 dark:border-white/5 bg-white dark:bg-[#1E2028] hover:border-[#00C888]/50 hover:-translate-y-1 hover:shadow-lg"
                            }
            `}
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div
                                className={`
                  p-3.5 rounded-[16px] transition-all duration-300 shadow-sm
                  ${selectedType === report.id
                                        ? "bg-[#00C888] text-white shadow-[#00C888]/20"
                                        : "bg-gray-50 dark:bg-white/5 text-gray-500 group-hover:bg-[#00C888]/10 group-hover:text-[#00C888]"
                                    }
                `}
                            >
                                <report.icon size={22} strokeWidth={2.5} />
                            </div>
                            <span
                                className={`
                  text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border
                  ${report.format === "pdf"
                                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                        : "bg-emerald-500/10 text-emerald-600 dark:text-[#00C888] border-emerald-500/20"
                                    }
                `}
                            >
                                {report.format}
                            </span>
                        </div>

                        <h3 className="font-black text-lg text-gray-900 dark:text-white mb-2 tracking-tight">
                            {report.name}
                        </h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                            {report.description}
                        </p>
                    </button>
                ))}
            </div>

            {/* Controls Container */}
            <div className="bg-white dark:bg-[#1E2028] p-5 md:p-8 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300">
                <h3 className="font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3 text-lg tracking-tight">
                    <div className="p-2 bg-[#00C888]/10 text-[#00C888] rounded-xl">
                        <Calendar size={20} />
                    </div>
                    Configure Report Range
                </h3>

                <div className="flex flex-col xl:flex-row gap-6 items-end">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                        <div>
                            <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5 block">Start Date</label>
                            <input
                                type="date"
                                value={format(dateRange.start, "yyyy-MM-dd")}
                                onChange={(e) =>
                                    setDateRange({ ...dateRange, start: new Date(e.target.value) })
                                }
                                className="w-full px-4 py-3.5 bg-gray-50/50 dark:bg-[#151925]/50 rounded-[16px] border border-gray-200 dark:border-white/5 focus:border-[#00C888] focus:ring-1 focus:ring-[#00C888] focus:bg-white dark:focus:bg-[#151925] outline-none transition-all font-bold text-gray-900 dark:text-white shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5 block">End Date</label>
                            <input
                                type="date"
                                value={format(dateRange.end, "yyyy-MM-dd")}
                                onChange={(e) =>
                                    setDateRange({ ...dateRange, end: new Date(e.target.value) })
                                }
                                className="w-full px-4 py-3.5 bg-gray-50/50 dark:bg-[#151925]/50 rounded-[16px] border border-gray-200 dark:border-white/5 focus:border-[#00C888] focus:ring-1 focus:ring-[#00C888] focus:bg-white dark:focus:bg-[#151925] outline-none transition-all font-bold text-gray-900 dark:text-white shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="w-full xl:w-auto">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full xl:w-auto px-8 py-3.5 bg-[#00C888] text-white font-black tracking-wide rounded-[16px] hover:bg-[#00B377] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-[0_8px_16px_-6px_rgba(0,200,136,0.4)] hover:shadow-[0_12px_20px_-6px_rgba(0,200,136,0.5)] transition-all hover:-translate-y-0.5"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={20} strokeWidth={2.5} />
                                    <span>{selectedType === 'monthly' ? 'Generate Preview' : 'Download CSV'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Quick Select Pills */}
                <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest py-1.5 mr-2">Quick Presets:</span>
                    {[
                        { label: "This Month", fn: () => ({ start: startOfMonth(now), end: endOfMonth(now) }) },
                        { label: "Last Month", fn: () => ({ start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) }) },
                        { label: "Last 3 Months", fn: () => ({ start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }) },
                        { label: "YTD", fn: () => ({ start: new Date(now.getFullYear(), 0, 1), end: now }) },
                    ].map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => setDateRange(preset.fn())}
                            className="px-4 py-2 text-[11px] font-black uppercase tracking-wider bg-gray-50 dark:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-white dark:hover:bg-white/10 hover:text-gray-900 hover:dark:text-white transition-all shadow-sm"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* PDF Preview Area */}
            {previewData && selectedType === "monthly" && (
                <ReportPreview data={previewData} onDownload={handleDownloadPDF} />
            )}
        </div>
    );
}
