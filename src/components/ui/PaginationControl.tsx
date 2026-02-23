'use client';

import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaginationControlProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
    itemName?: string;
}

export const PaginationControl = ({
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
    itemName = "results"
}: PaginationControlProps) => {

    // Calculate range
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    if (totalItems === 0) return null;

    // Generate page numbers
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');

            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage < 3) end = 4;
            if (currentPage > totalPages - 2) start = totalPages - 3;

            for (let i = start; i <= end; i++) pages.push(i);

            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
            {/* Left: Info & Size Selector */}
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="hidden sm:inline">
                    Showing <span className="font-bold text-gray-900 dark:text-gray-200">{startItem}-{endItem}</span> of <span className="font-bold text-gray-900 dark:text-gray-200">{totalItems}</span> {itemName}
                </span>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Show:</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1 font-bold text-gray-900 dark:text-white hover:text-primary transition-colors bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-1 rounded-lg">
                                {pageSize}
                                <ChevronDown size={14} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {pageSizeOptions.map((size) => (
                                <DropdownMenuItem
                                    key={size}
                                    onClick={() => onPageSizeChange(size)}
                                    className={pageSize === size ? "bg-primary/10 text-primary font-bold" : ""}
                                >
                                    {size} / page
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Right: Navigation */}
            <div className="flex items-center gap-1.5 p-1">
                <button
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="p-2 rounded-xl transition-all text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1 px-1">
                    {getPageNumbers().map((p, idx) => (
                        typeof p === 'number' ? (
                            <button
                                key={idx}
                                onClick={() => onPageChange(p)}
                                className={`min-w-[36px] h-9 px-3 flex items-center justify-center rounded-xl font-bold text-sm transition-all ${p === currentPage
                                        ? 'bg-[#00C888] text-white shadow-md shadow-[#00C888]/20 ring-1 ring-[#00C888]/50'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10'
                                    }`}
                            >
                                {p}
                            </button>
                        ) : (
                            <span key={idx} className="w-9 h-9 flex items-center justify-center text-gray-400 font-bold text-xs select-none">...</span>
                        )
                    ))}
                </div>

                <button
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="p-2 rounded-xl transition-all text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};
