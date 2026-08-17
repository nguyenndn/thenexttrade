"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button-variants";

interface PaginationProps {
    totalPages: number;
}

type PageItem = number | "ellipsis-start" | "ellipsis-end";

// Collapses the page list into: first page(s), current-page window, last page(s),
// with "…" in between so a long list never floods the row.
function getPageList(
    currentPage: number,
    totalPages: number,
    siblingCount = 1
): PageItem[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: PageItem[] = [1];
    const startPage = Math.max(2, currentPage - siblingCount);
    const endPage = Math.min(totalPages - 1, currentPage + siblingCount);

    if (startPage > 2) pages.push("ellipsis-start");
    for (let p = startPage; p <= endPage; p++) pages.push(p);
    if (endPage < totalPages - 1) pages.push("ellipsis-end");

    pages.push(totalPages);
    return pages;
}

export const Pagination = ({ totalPages }: PaginationProps) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentPage = Number(searchParams.get("page")) || 1;

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-end mt-8">
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20">
                {/* Previous Button */}
                <Link
                    href={createPageURL(currentPage - 1)}
                    className={buttonVariants({
                        variant: "outline",
                        size: "icon",
                        className: `h-9 w-9 rounded-xl border-white/20 ${
                            currentPage <= 1
                                ? "opacity-50 pointer-events-none"
                                : "hover:bg-white/60 dark:hover:bg-white/10"
                        }`,
                    })}
                    aria-disabled={currentPage <= 1}
                    aria-label="Previous Page"
                >
                    <ChevronLeft size={16} />
                </Link>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                    {getPageList(currentPage, totalPages).map((item, index) => {
                        if (
                            item === "ellipsis-start" ||
                            item === "ellipsis-end"
                        ) {
                            return (
                                <span
                                    key={`${item}-${index}`}
                                    aria-hidden="true"
                                    className="w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold text-gray-400 dark:text-gray-500 select-none"
                                >
                                    …
                                </span>
                            );
                        }
                        const page = item;
                        return (
                            <Link
                                key={page}
                                href={createPageURL(page)}
                                className={buttonVariants({
                                    variant:
                                        page === currentPage
                                            ? "primary"
                                            : "outline",
                                    className: `w-9 h-9 p-0 flex items-center justify-center rounded-xl font-bold text-xs transition-all border-white/20 ${
                                        page === currentPage
                                            ? "bg-primary text-white shadow-lg shadow-primary/30"
                                            : "text-gray-600 dark:text-gray-500 hover:bg-white/60 dark:hover:bg-white/10"
                                    }`,
                                })}
                                aria-label={`Page ${page}`}
                                aria-current={
                                    page === currentPage ? "page" : undefined
                                }
                            >
                                {page}
                            </Link>
                        );
                    })}
                </div>

                {/* Next Button */}
                <Link
                    href={createPageURL(currentPage + 1)}
                    className={buttonVariants({
                        variant: "outline",
                        size: "icon",
                        className: `h-9 w-9 rounded-xl border-white/20 ${
                            currentPage >= totalPages
                                ? "opacity-50 pointer-events-none"
                                : "hover:bg-white/60 dark:hover:bg-white/10"
                        }`,
                    })}
                    aria-disabled={currentPage >= totalPages}
                    aria-label="Next Page"
                >
                    <ChevronRight size={16} />
                </Link>
            </div>
        </div>
    );
};
