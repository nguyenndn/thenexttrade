'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { buttonVariants } from '@/components/ui/Button';

interface PaginationProps {
    totalPages: number;
}

export const Pagination = ({ totalPages }: PaginationProps) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentPage = Number(searchParams.get('page')) || 1;

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center mt-12">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10">

                {/* Previous Button */}
                <Link
                    href={createPageURL(currentPage - 1)}
                    className={buttonVariants({
                        variant: 'outline',
                        size: 'icon',
                        className: `rounded-xl border-white/20 dark:border-white/10 ${currentPage <= 1
                            ? 'opacity-50 pointer-events-none'
                            : 'hover:bg-white/60 dark:hover:bg-white/10'
                            }`
                    })}
                    aria-disabled={currentPage <= 1}
                    aria-label="Previous Page"
                >
                    <ChevronLeft size={20} />
                </Link>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Link
                            key={page}
                            href={createPageURL(page)}
                            className={buttonVariants({
                                variant: page === currentPage ? 'primary' : 'outline',
                                className: `w-10 h-10 p-0 flex items-center justify-center rounded-xl font-bold text-sm transition-all border-white/20 dark:border-white/10 ${page === currentPage
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/10'
                                    }`
                            })}
                            aria-label={`Page ${page}`}
                            aria-current={page === currentPage ? "page" : undefined}
                        >
                            {page}
                        </Link>
                    ))}
                </div>

                {/* Next Button */}
                <Link
                    href={createPageURL(currentPage + 1)}
                    className={buttonVariants({
                        variant: 'outline',
                        size: 'icon',
                        className: `rounded-xl border-white/20 dark:border-white/10 ${currentPage >= totalPages
                            ? 'opacity-50 pointer-events-none'
                            : 'hover:bg-white/60 dark:hover:bg-white/10'
                            }`
                    })}
                    aria-disabled={currentPage >= totalPages}
                    aria-label="Next Page"
                >
                    <ChevronRight size={20} />
                </Link>
            </div>
        </div>
    );
};
