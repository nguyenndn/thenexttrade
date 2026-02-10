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
              relative text-left p-6 rounded-[1.5rem] border-2 transition-all duration-300 group
              ${selectedType === report.id
                                ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 -translate-y-1"
                                : "border-gray-200 dark:border-white/5 bg-white dark:bg-[#1E2028] hover:border-primary/50 hover:-translate-y-1 hover:shadow-lg"
                            }
            `}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div
                                className={`
                  p-3 rounded-xl transition-colors
                  ${selectedType === report.id
                                        ? "bg-primary text-white"
                                        : "bg-gray-100 dark:bg-white/5 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary"
                                    }
                `}
                            >
                                <report.icon size={24} />
                            </div>
                            <span
                                className={`
                  text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md
                  ${report.format === "pdf"
                                        ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                                        : "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                                    }
                `}
                            >
                                {report.format}
                            </span>
                        </div>

                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                            {report.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            {report.description}
                        </p>
                    </button>
                ))}
            </div>

            {/* Controls Container */}
            <div className="bg-white dark:bg-[#1E2028] p-4 md:p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3 text-lg">
                    <Calendar size={20} className="text-primary" />
                    Configure Report Range
                </h3>

                <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <div>
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Start Date</label>
                            <input
                                type="date"
                                value={format(dateRange.start, "yyyy-MM-dd")}
                                onChange={(e) =>
                                    setDateRange({ ...dateRange, start: new Date(e.target.value) })
                                }
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151925] rounded-xl border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-[#0B0E14] outline-none transition-all font-medium text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">End Date</label>
                            <input
                                type="date"
                                value={format(dateRange.end, "yyyy-MM-dd")}
                                onChange={(e) =>
                                    setDateRange({ ...dateRange, end: new Date(e.target.value) })
                                }
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151925] rounded-xl border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-[#0B0E14] outline-none transition-all font-medium text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-auto">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full md:w-auto px-8 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-[#00B377] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Download size={20} />
                                    {selectedType === 'monthly' ? 'Generate Preview' : 'Download CSV'}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Quick Select Pills */}
                <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest py-1.5">Quick Presets:</span>
                    {[
                        { label: "This Month", fn: () => ({ start: startOfMonth(now), end: endOfMonth(now) }) },
                        { label: "Last Month", fn: () => ({ start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) }) },
                        { label: "Last 3 Months", fn: () => ({ start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }) },
                        { label: "YTD", fn: () => ({ start: new Date(now.getFullYear(), 0, 1), end: now }) },
                    ].map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => setDateRange(preset.fn())}
                            className="px-4 py-1.5 text-xs font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
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
