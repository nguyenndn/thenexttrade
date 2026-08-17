"use client";

import React, { useState } from "react";
import { GripHorizontal, Trash2, PlusCircle, Columns } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface PreviewData {
    headers: string[];
    rows: any[][];
}

interface DraggablePreviewTableProps {
    initialData: PreviewData;
    onChange: (data: PreviewData) => void;
}

export function DraggablePreviewTable({
    initialData,
    onChange,
}: DraggablePreviewTableProps) {
    const [headers, setHeaders] = useState<string[]>(initialData.headers);
    const [hiddenHeaders, setHiddenHeaders] = useState<{ name: string }[]>([]);
    const [rows, setRows] = useState<any[][]>(initialData.rows);
    const [draggedColIdx, setDraggedColIdx] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedColIdx(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedColIdx === null || draggedColIdx === targetIndex) return;

        // Reorder headers
        const newHeaders = [...headers];
        const [movedHeader] = newHeaders.splice(draggedColIdx, 1);
        newHeaders.splice(targetIndex, 0, movedHeader);

        // Reorder rows
        const newRows = rows.map((row) => {
            const newRow = [...row];
            const [movedCell] = newRow.splice(draggedColIdx, 1);
            newRow.splice(targetIndex, 0, movedCell);
            return newRow;
        });

        setHeaders(newHeaders);
        setRows(newRows);
        setDraggedColIdx(null);
        onChange({ headers: newHeaders, rows: newRows });
    };

    const removeColumn = (indexToRemove: number) => {
        const headerToRemove = headers[indexToRemove];

        setHiddenHeaders((prev) => [...prev, { name: headerToRemove }]);

        const newHeaders = [...headers];
        newHeaders.splice(indexToRemove, 1);

        const newRows = rows.map((row) => {
            const newRow = [...row];
            newRow.splice(indexToRemove, 1);
            return newRow;
        });

        setHeaders(newHeaders);
        setRows(newRows);
        onChange({ headers: newHeaders, rows: newRows });
    };

    const restoreColumn = (hidden: { name: string }) => {
        // Find the original index in `initialData.headers`
        const originalIndex = initialData.headers.findIndex(
            (h) => h === hidden.name
        );
        if (originalIndex === -1) return;

        // Append it to the end
        const newHeaders = [...headers, hidden.name];

        const newRows = rows.map((row, rIdx) => {
            const newRow = [...row];
            // Get the value from initialData.rows
            newRow.push(initialData.rows[rIdx][originalIndex]);
            return newRow;
        });

        setHeaders(newHeaders);
        setRows(newRows);
        setHiddenHeaders((prev) => prev.filter((h) => h.name !== hidden.name));
        onChange({ headers: newHeaders, rows: newRows });
    };

    return (
        <div className="space-y-4">
            {hiddenHeaders.length > 0 && (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs font-bold gap-1.5 shadow-sm bg-white dark:bg-[#1E2028]"
                            >
                                <Columns size={14} className="text-primary" />{" "}
                                Add Column
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 bg-white dark:bg-[#1E2028] border-dashboard rounded-xl p-2 shadow-xl z-50"
                        >
                            <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                                Restored Columns
                            </div>
                            {hiddenHeaders.map((hidden) => (
                                <DropdownMenuItem
                                    key={hidden.name}
                                    onClick={() => restoreColumn(hidden)}
                                    className="text-xs font-medium cursor-pointer flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg py-2"
                                >
                                    <PlusCircle
                                        size={14}
                                        className="text-primary"
                                    />{" "}
                                    {hidden.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-dashboard custom-scrollbar bg-white dark:bg-[#1E2028]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-white/5 border-b border-dashboard">
                            {headers.map((header, index) => (
                                <th
                                    key={`${header}-${index}`}
                                    draggable
                                    onDragStart={(e) =>
                                        handleDragStart(e, index)
                                    }
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDrop={(e) => handleDrop(e, index)}
                                    className={`p-4 text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 whitespace-nowrap min-w-[120px] group cursor-grab active:cursor-grabbing border-r border-dashboard/50 last:border-r-0 ${draggedColIdx === index ? "opacity-40 bg-primary/5" : ""}`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <GripHorizontal
                                                size={14}
                                                className="text-gray-400 group-hover:text-primary transition-colors"
                                            />
                                            <span>{header}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeColumn(index)}
                                            className="h-7 w-7 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg shrink-0"
                                            title="Remove Column"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dashboard">
                        {rows.slice(0, 50).map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                            >
                                {row.map((cell, cellIndex) => (
                                    <td
                                        key={`${rowIndex}-${cellIndex}`}
                                        className="p-4 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap truncate max-w-[200px]"
                                        title={String(cell)}
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {rows.length > 50 && (
                            <tr>
                                <td
                                    colSpan={headers.length}
                                    className="p-4 text-center text-sm font-medium text-gray-600 dark:text-gray-300 italic bg-gray-50/50 dark:bg-white/5"
                                >
                                    Showing first 50 rows of {rows.length} total
                                    rows.
                                </td>
                            </tr>
                        )}
                        {rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={headers.length}
                                    className="p-8 text-center text-sm font-medium text-gray-500"
                                >
                                    No data available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
