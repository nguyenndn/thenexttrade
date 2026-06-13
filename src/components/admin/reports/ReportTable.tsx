import Link from "next/link";
import { cn } from "@/lib/utils";

interface Column<T> {
 key: string;
 label: string;
 render?: (row: T) => React.ReactNode;
 align?: "left" | "center" | "right";
 className?: string;
}

interface ReportTableProps<T> {
 columns: Column<T>[];
 rows: T[];
 getRowHref?: (row: T) => string | undefined;
 emptyMessage?: string;
}

export function ReportTable<T extends Record<string, unknown>>({
 columns,
 rows,
 getRowHref,
 emptyMessage = "No data available.",
}: ReportTableProps<T>) {
 if (rows.length === 0) {
 return (
 <div className="text-center py-8 text-sm text-gray-400">{emptyMessage}</div>
 );
 }

 return (
 <div className="overflow-x-auto -mx-6 md:-mx-8">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-dashboard">
 {columns.map((col) => (
 <th
 key={col.key}
 className={cn(
 "px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap",
 col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
 col.className
 )}
 >
 {col.label}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {rows.map((row, idx) => {
 const href = getRowHref?.(row);
 const cells = columns.map((col) => (
 <td
 key={col.key}
 className={cn(
 "px-4 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-200",
 col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
 col.className
 )}
 >
 {col.render ? col.render(row) : String(row[col.key] ?? "")}
 </td>
 ));

 return (
 <tr
 key={idx}
 className={cn(
 "border-b border-gray-50 transition-colors",
 href ? "hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer" : ""
 )}
 >
 {href ? (
 cells.map((cell, cIdx) => (
 <td key={cIdx} className="p-0">
 <Link href={href} className="block px-4 py-2.5">
 {cell.props.children}
 </Link>
 </td>
 ))
 ) : (
 cells
 )}
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 );
}
