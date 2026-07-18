"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { toast } from "sonner";
import {
 FileText,
 Download,
 FileSpreadsheet,
 Calendar,
 TrendingUp,
 Trash2,
 CalendarDays,
 CalendarRange,
 AlertTriangle,
 Trophy,
 PenLine,
} from "lucide-react";
import { ReportPreview } from "./ReportPreview";
import { ReportView } from "./ReportView";
import { GenerateReportButton } from "./GenerateReportButton";
import { DraggablePreviewTable } from "./DraggablePreviewTable";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import type { GenerateReportResult } from "./report-generate-types";

interface ReportType {
 id: string;
 name: string;
 description: string;
 format: "pdf" | "csv" | "auto" | "json";
 icon: any;
}

const REPORT_TYPES: ReportType[] = [
 {
 id: "weekly-review",
 name: "Weekly Review",
 description: "Automated weekly trading performance review",
 format: "auto",
 icon: CalendarDays,
 },
 {
 id: "monthly-review",
 name: "Monthly Review",
 description: "Big picture monthly performance trends",
 format: "auto",
 icon: CalendarRange,
 },
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

 // Read ?type= from URL to auto-select tab (e.g. from mission CTA)
 const searchParamsHook = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
 const typeParam = searchParamsHook?.get("type");
 const validTypes = REPORT_TYPES.map((t) => t.id);
 const initialType = typeParam && validTypes.includes(typeParam) ? typeParam : "weekly-review";

 const [selectedType, setSelectedType] = useState<string>(initialType);
 const [dateRange, setDateRange] = useState({
 start: startOfMonth(subMonths(now, 1)),
 end: endOfMonth(subMonths(now, 1)),
 });
 const [isGenerating, setIsGenerating] = useState(false);
 const [previewData, setPreviewData] = useState<any>(null);
 const [csvPreview, setCsvPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
 const [reviewReports, setReviewReports] = useState<any[]>([]);
 const [reviewTotal, setReviewTotal] = useState(0);
 const [reviewLoading, setReviewLoading] = useState(false);
 const [reviewLoaded, setReviewLoaded] = useState<string | null>(null);
 const [lastGenerateResult, setLastGenerateResult] = useState<GenerateReportResult | null>(null);

 const isReviewType = selectedType === "weekly-review" || selectedType === "monthly-review";
 const isExportType = selectedType === "monthly" || selectedType === "trades" || selectedType === "tax" || selectedType === "backup";

 // Auto-load weekly review on mount
 useEffect(() => {
 handleSelectType("weekly-review");
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 const handleSelectType = async (id: string) => {
 setSelectedType(id);
 setPreviewData(null);
 setCsvPreview(null);

 // Auto-load review reports
 if (id === "weekly-review" || id === "monthly-review") {
 if (reviewLoaded === id) return; // Already loaded
 setReviewLoading(true);
 try {
 const { getReports } = await import("@/actions/reports");
 const type = id === "weekly-review" ? "WEEKLY" : "MONTHLY";
 const { reports, total } = await getReports(type as any, 1, 20);
 setReviewReports(reports);
 setReviewTotal(total);
 setReviewLoaded(id);
 } catch (error) {
 console.error("Failed to load reports:", error);
 toast.error("Failed to load reports");
 } finally {
 setReviewLoading(false);
 }
 }
 };

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
 <div className="space-y-4 animate-in fade-in duration-500">

 {/* Report Type Selection */}
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
 {REPORT_TYPES.map((report) => {
 const isSelected = selectedType === report.id;

 return (
              <Button
                variant="ghost"
                key={report.id}
                onClick={() => handleSelectType(report.id)}
                className={`
                  relative text-left p-3 sm:p-4 lg:p-3 h-[110px] rounded-xl border transition-all duration-300 group flex flex-col items-start justify-start whitespace-normal hover:bg-white dark:hover:bg-[#1E2028] font-normal overflow-hidden
                  ${isSelected
                    ? "border-primary bg-primary/5 shadow-sm hover:bg-primary/5"
                    : "border-dashboard bg-white dark:bg-[#1E2028] hover:border-primary/50 hover:shadow-sm"
                  }
                `}
              >
                <div className="flex items-start justify-between mb-2 w-full">
                  <div
                    className={`
                      p-2 rounded-lg transition-all duration-300 shadow-sm
                      ${isSelected
                        ? "bg-primary text-white"
                        : "bg-gray-50 dark:bg-white/5 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary"
                      }
                    `}
                  >
                    <report.icon size={16} strokeWidth={2.5} className="w-4 h-4" />
                  </div>
                  <span
                    className={`
                      text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border
                      ${report.format === "pdf"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                        : report.format === "auto"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        : report.format === "json"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        : "bg-primary/10 text-primary dark:text-primary border-primary/20"
                      }
                    `}
                  >
                    {report.format}
                  </span>
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-gray-700 dark:text-white mb-0.5 tracking-tight truncate w-full">
                  {report.name}
                </h3>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-snug text-left w-full line-clamp-2">
                  {report.description}
                </p>
              </Button>
 );
 })}
 </div>

 {/* Review Reports Inline (Weekly/Monthly) */}
 {isReviewType && (
 <div className="animate-in fade-in duration-500 space-y-4">
 {/* Generate Report Button */}
 <div className="flex items-center justify-between bg-white dark:bg-[#0B0E14] rounded-xl border border-dashboard p-4 shadow-sm">
 <div>
 <p className="text-sm font-bold text-gray-700 dark:text-white">
 {selectedType === "weekly-review" ? "Generate Latest Weekly Review" : "Generate Latest Monthly Review"}
 </p>
 <p className="text-xs text-gray-500">
 Create a new review based on your latest trading data.
 </p>
 </div>
 <GenerateReportButton
 type={selectedType === "weekly-review" ? "WEEKLY" : "MONTHLY"}
 onResult={(result) => {
 setLastGenerateResult(result);
 if (result.success && !result.alreadyExists) {
 handleSelectType(selectedType); // Refresh reports
 setReviewLoaded(null); // Force reload
 }
 }}
 />
 </div>

 {/* No-data inline notice */}
 {lastGenerateResult?.code === "NO_TRADES_THIS_WEEK" && selectedType === "weekly-review" && (
 <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
 <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
 <div className="flex-1">
 <p className="text-sm font-bold text-gray-800 dark:text-white">Not enough trade data yet</p>
 <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
 Add at least one trade for this week, then generate your weekly review to find your strongest setup and biggest leak.
 </p>
 <Link href="/dashboard/journal?action=log-trade">
 <Button variant="primary" size="smd" className="mt-2">
 <PenLine size={13} className="mr-1" /> Log Trade
 </Button>
 </Link>
 </div>
 </div>
 )}

 {/* Mission reward panel */}
 {lastGenerateResult?.missionReward?.claimable && (
 <div className="flex items-center gap-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-4">
 <div className="p-2 bg-primary/10 rounded-lg">
 <Trophy size={18} className="text-primary" />
 </div>
 <div className="flex-1">
 <p className="text-sm font-bold text-gray-800 dark:text-white">Mission Complete!</p>
 <p className="text-xs text-gray-600 dark:text-gray-400">
 Your weekly review completed a mission. Claim {lastGenerateResult.missionReward.totalEdge} Edge when you're ready.
 </p>
 </div>
 <Link href="/dashboard/missions">
 <Button variant="primary" size="smd">
 Claim Edge
 </Button>
 </Link>
 </div>
 )}
 {reviewLoading ? (
 <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-dashboard p-12 text-center shadow-sm">
 <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
 <p className="text-sm text-gray-500">Loading reports...</p>
 </div>
 ) : (
 <ReportView
 reports={reviewReports as any}
 total={reviewTotal}
 type={selectedType === "weekly-review" ? "weekly" : "monthly"}
 />
 )}
 </div>
 )}

 {/* Export Controls (for PDF/CSV types) */}
 {isExportType && (
 <>
 <div className="bg-white dark:bg-[#1E2028] p-5 md:p-8 rounded-xl border border-dashboard shadow-sm hover:shadow-md transition-shadow">
 <h3 className="font-black text-gray-700 dark:text-white mb-6 flex items-center gap-3 text-lg tracking-tight">
 <div className="p-2 bg-primary/10 text-primary rounded-xl">
 <Calendar size={20} />
 </div>
 Configure Report Range
 </h3>

 <div className="flex flex-col xl:flex-row gap-4 items-end">
 <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
 <div>
 <label className="text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2.5 block">Start Date</label>
 <input
 type="date"
 value={format(dateRange.start, "yyyy-MM-dd")}
 onChange={(e) =>
 setDateRange({ ...dateRange, start: new Date(e.target.value) })
 }
 className="w-full rounded-xl border border-dashboard bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-700 dark:text-white"
 />
 </div>
 <div>
 <label className="text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2.5 block">End Date</label>
 <input
 type="date"
 value={format(dateRange.end, "yyyy-MM-dd")}
 onChange={(e) =>
 setDateRange({ ...dateRange, end: new Date(e.target.value) })
 }
 className="w-full rounded-xl border border-dashboard bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-700 dark:text-white"
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
 <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-8 pt-6 border-t border-dashboard">
 <span className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest sm:mr-2">Quick Presets:</span>
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
 className="px-4 py-2 text-[11px] font-black uppercase tracking-wider bg-transparent border-2 border-dashboard/80 dark:border-slate-800 hover:border-primary/60 dark:hover:border-primary/50 text-slate-500 dark:text-slate-400 hover:text-primary hover:dark:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl transition-all duration-300"
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
 <div className="bg-white dark:bg-[#1E2028] p-5 md:p-8 rounded-xl border border-dashboard shadow-sm animate-in fade-in duration-500">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
 <div>
 <h3 className="font-black text-gray-700 dark:text-white text-lg tracking-tight">CSV Preview</h3>
 <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Review data and remove unnecessary columns before downloading.</p>
 </div>
 <Button
 onClick={handleDownloadCustomCSV}
 className="w-full sm:w-auto"
 >
 <Download size={18} strokeWidth={2.5} />
 Download Final CSV
 </Button>
 </div>

 <DraggablePreviewTable initialData={csvPreview} onChange={setCsvPreview} />
 </div>
 )}
 </>
 )}
 </div>
 );
}
