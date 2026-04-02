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
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <span className="hidden sm:inline">
                    Showing <span className="font-bold text-gray-900 dark:text-gray-200">{startItem}-{endItem}</span> of <span className="font-bold text-gray-900 dark:text-gray-200">{totalItems}</span> {itemName}
                </span>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Show:</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="font-bold flex items-center gap-1">
                                {pageSize}
                                <ChevronDown size={14} />
                            </Button>
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
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="text-gray-600 hover:text-gray-900 dark:hover:text-white disabled:opacity-30"
                >
                    <ChevronLeft size={16} />
                </Button>

                <div className="flex items-center gap-1 px-1">
                    {getPageNumbers().map((p, idx) => (
                        typeof p === 'number' ? (
                            <Button
                                key={idx}
                                variant={p === currentPage ? "primary" : "ghost"}
                                onClick={() => onPageChange(p)}
                                className={`w-9 h-9 px-0 sm:px-3 sm:w-auto font-bold text-sm ${
                                    p === currentPage
                                        ? 'shadow-md shadow-[#00C888]/20'
                                        : 'text-gray-600 dark:text-gray-400'
                                }`}
                            >
                                {p}
                            </Button>
                        ) : (
                            <span key={idx} className="w-9 h-9 flex items-center justify-center text-gray-400 font-bold text-xs select-none">...</span>
                        )
                    ))}
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="text-gray-600 hover:text-gray-900 dark:hover:text-white disabled:opacity-30"
                >
                    <ChevronRight size={16} />
                </Button>
            </div>
        </div>
    );
};
