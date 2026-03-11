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
    Trash2
} from "lucide-react";
import { ReportPreview } from "./ReportPreview";
import { Button } from "@/components/ui/Button";

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

const parseCSVLine = (line: string) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (line[i] === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += line[i];
        }
    }
    result.push(current);
    return result;
};

export function ReportsDashboard() {
    const now = new Date();
    const [selectedType, setSelectedType] = useState<string>("monthly");
    const [dateRange, setDateRange] = useState({
        start: startOfMonth(subMonths(now, 1)), // Default to last month
        end: endOfMonth(subMonths(now, 1)),
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);
    const [csvPreview, setCsvPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);

    const selectedReport = REPORT_TYPES.find((r) => r.id === selectedType);

    const handleGenerate = async () => {
        try {
            setIsGenerating(true);

            if (selectedType === "trades" || selectedType === "tax") {
                // CSV preview instead of direct download
                const params = new URLSearchParams({
                    type: selectedType,
                    startDate: format(dateRange.start, "yyyy-MM-dd"),
                    endDate: format(dateRange.end, "yyyy-MM-dd"),
                });

                const response = await fetch(`/api/export/csv?${params}`);
                if (!response.ok) throw new Error("Failed to generate CSV");

                const text = await response.text();
                
                // Parse CSV text for preview Grid
                const lines = text.split('\n').filter(line => line.trim() !== '');
                if (lines.length > 0) {
                    const headers = parseCSVLine(lines[0]);
                    const rows = lines.slice(1).map(parseCSVLine);
                    setCsvPreview({ headers, rows });
                    toast.success("Ready to preview");
                } else {
                    toast.error("No data found for this period");
                }
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
        } catch (error: any) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : (error?.message || "Failed to generate report"));
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
        } catch (e: any) {
            console.error(e);
            toast.error(e instanceof Error ? e.message : (e?.message || "Failed to generate PDF"));
        }
    };

    const removeColumn = (indexToRemove: number) => {
        if (!csvPreview) return;
        
        setCsvPreview(prev => {
            if (!prev) return prev;
            
            const newHeaders = [...prev.headers];
            newHeaders.splice(indexToRemove, 1);
            
            const newRows = prev.rows.map(row => {
                const newRow = [...row];
                newRow.splice(indexToRemove, 1);
                return newRow;
            });
            
            return { headers: newHeaders, rows: newRows };
        });
    };

    const handleDownloadCustomCSV = () => {
        if (!csvPreview) return;

        const escapeCSV = (cell: string) => {
            const strCell = String(cell);
            if (strCell.includes(',') || strCell.includes('"') || strCell.includes('\n')) {
                return `"${strCell.replace(/"/g, '""')}"`;
            }
            return `"${strCell.replace(/"/g, '""')}"`;
        };

        const headerLine = csvPreview.headers.map(escapeCSV).join(',');
        const rowLines = csvPreview.rows.map(row => row.map(escapeCSV).join(','));
        const csvContent = [headerLine, ...rowLines].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedType}_${format(dateRange.start, "yyyy-MM-dd")}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success("Downloaded successfully");
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Report Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {REPORT_TYPES.map((report) => (
                    <Button
                        variant="ghost"
                        key={report.id}
                        onClick={() => {
                            setSelectedType(report.id);
                            setPreviewData(null);
                            setCsvPreview(null);
                        }}
                        className={`
              relative text-left p-6 h-auto rounded-xl border-2 transition-all duration-300 group flex flex-col items-start justify-start whitespace-normal hover:bg-white dark:hover:bg-[#1E2028] font-normal
              ${selectedType === report.id
                                ? "border-primary bg-primary/5 shadow-md shadow-primary/10 hover:bg-primary/5"
                                : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] hover:border-primary/50 hover:shadow-md transition-shadow"
                            }
            `}
                    >
                        <div className="flex items-start justify-between mb-6 w-full">
                            <div
                                className={`
                  p-3.5 rounded-xl transition-all duration-300 shadow-sm
                  ${selectedType === report.id
                                        ? "bg-primary text-white shadow-primary/20"
                                        : "bg-gray-50 dark:bg-white/5 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary"
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
                                        : "bg-primary/10 text-primary dark:text-primary border-primary/20"
                                    }
                `}
                            >
                                {report.format}
                            </span>
                        </div>

                        <h3 className="font-black text-lg text-gray-900 dark:text-white mb-2 tracking-tight">
                            {report.name}
                        </h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed text-left w-full">
                            {report.description}
                        </p>
                    </Button>
                ))}
            </div>

            {/* Controls Container */}
            <div className="bg-white dark:bg-[#1E2028] p-5 md:p-8 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3 text-lg tracking-tight">
                    <div className="p-2 bg-primary/10 text-primary rounded-xl">
                        <Calendar size={20} />
                    </div>
                    Configure Report Range
                </h3>

                <div className="flex flex-col xl:flex-row gap-4 items-end">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                        <div>
                            <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5 block">Start Date</label>
                            <input
                                type="date"
                                value={format(dateRange.start, "yyyy-MM-dd")}
                                onChange={(e) =>
                                    setDateRange({ ...dateRange, start: new Date(e.target.value) })
                                }
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-900 dark:text-white"
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
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="w-full xl:w-auto">
                        <Button
                            onClick={handleGenerate}
                            isLoading={isGenerating}
                            className="w-full xl:w-auto"
                        >
                            {!isGenerating && <Download size={20} strokeWidth={2.5} />}
                            <span>{isGenerating ? "Processing..." : "Generate Preview"}</span>
                        </Button>
                    </div>
                </div>

                {/* Quick Select Pills */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest sm:mr-2">Quick Presets:</span>
                    <div className="flex flex-wrap items-center gap-2.5">
                        {[
                            { label: "This Month", fn: () => ({ start: startOfMonth(now), end: endOfMonth(now) }) },
                            { label: "Last Month", fn: () => ({ start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) }) },
                            { label: "Last 3 Months", fn: () => ({ start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }) },
                            { label: "YTD", fn: () => ({ start: new Date(now.getFullYear(), 0, 1), end: now }) },
                        ].map((preset) => (
                            <Button
                                variant="outline"
                                key={preset.label}
                                onClick={() => setDateRange(preset.fn())}
                                className="px-4 py-2 text-[11px] font-black uppercase tracking-wider bg-transparent border-2 border-slate-200/80 dark:border-slate-800 hover:border-primary/60 dark:hover:border-primary/50 text-slate-500 dark:text-slate-400 hover:text-primary hover:dark:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl transition-all duration-300"
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* PDF Preview Area */}
            {previewData && selectedType === "monthly" && (
                <ReportPreview data={previewData} onDownload={handleDownloadPDF} />
            )}

            {/* CSV Preview Area */}
            {csvPreview && (selectedType === "trades" || selectedType === "tax") && (
                <div className="bg-white dark:bg-[#1E2028] p-5 md:p-8 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm animate-in fade-in duration-500">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="font-black text-gray-900 dark:text-white text-lg tracking-tight">CSV Preview</h3>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Review data and remove unnecessary columns before downloading.</p>
                        </div>
                        <Button
                            onClick={handleDownloadCustomCSV}
                            className="w-full sm:w-auto"
                        >
                            <Download size={18} strokeWidth={2.5} />
                            Download Final CSV
                        </Button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                    {csvPreview.headers.map((header, index) => (
                                        <th key={index} className="p-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[120px] group">
                                            <div className="flex items-center justify-between gap-2">
                                                <span>{header}</span>
                                                <Button 
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeColumn(index)}
                                                    className="h-7 w-7 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                    title="Remove Column"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {csvPreview.rows.slice(0, 50).map((row, rowIndex) => (
                                    <tr key={rowIndex} className="border-b border-gray-200 dark:border-white/10 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                        {row.map((cell, cellIndex) => (
                                            <td key={cellIndex} className="p-4 text-sm font-medium text-gray-900 dark:text-gray-300 whitespace-nowrap truncate max-w-[200px]" title={cell}>
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {csvPreview.rows.length > 50 && (
                                    <tr>
                                        <td colSpan={csvPreview.headers.length} className="p-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400 italic bg-gray-50/50 dark:bg-white/5">
                                            Showing first 50 rows of {csvPreview.rows.length} total rows.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
