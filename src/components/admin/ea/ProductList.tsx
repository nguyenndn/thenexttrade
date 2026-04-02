"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Bot, Download, Edit, Power, Trash2, Search, Filter, ArrowUpDown, ChevronUp, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { deleteEAProduct } from "@/app/admin/ea/actions";
import { EAProduct } from "@/types/ea-license";
import { EAType, PlatformType } from "@prisma/client";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface ProductListProps {
    products: EAProduct[];
}

type SortField = "name" | "createdAt" | "totalDownloads" | "isActive" | "type" | "platform" | "version";
type SortDirection = "asc" | "desc";

export function ProductList({ products }: ProductListProps) {
    // Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<EAType | "ALL">("ALL");
    // Sort State
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    // Confirm Dialog State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmDelete = (productId: string) => {
        setProductToDeleteId(productId);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!productToDeleteId) return;

        setIsDeleting(true);
        try {
            const result = await deleteEAProduct(productToDeleteId);
            if (result.success) {
                toast.success("Product deleted successfully");
                setIsConfirmOpen(false);
                setProductToDeleteId(null);
            } else {
                toast.error(result.error);
                setIsConfirmOpen(false);
            }
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : (error?.message || "Failed to delete product"));
            setIsConfirmOpen(false);
        } finally {
            setIsDeleting(false);
        }
    };

    // Toggle Sort
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    // Derived Data
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === "ALL" || product.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [products, searchTerm, filterType]);

    const sortedProducts = useMemo(() => {
        return [...filteredProducts].sort((a, b) => {
            let aValue: any = a[sortField];
            let bValue: any = b[sortField];

            // Handle strings case-insensitive
            if (typeof aValue === "string") aValue = aValue.toLowerCase();
            if (typeof bValue === "string") bValue = bValue.toLowerCase();

            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [filteredProducts, sortField, sortDirection]);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown size={14} className="ml-1 text-gray-400 opacity-50" />;
        return sortDirection === "asc" ? (
            <ChevronUp size={14} className="ml-1 text-primary" />
        ) : (
            <ChevronDown size={14} className="ml-1 text-primary" />
        );
    };

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar Card */}
            <div className="bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors flex-1 w-full max-w-md h-[38px]">
                    <Search size={16} className="text-gray-400" aria-hidden="true" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent text-sm focus:outline-none w-full text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-4 w-full md:w-auto overflow-x-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="md"
                                className="h-[38px] flex items-center justify-between gap-2 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 w-full md:w-48 group hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                                <span className="whitespace-nowrap flex items-center gap-1.5 font-medium">
                                    Type: <span className="text-primary font-bold">{filterType === "ALL" ? "All" : filterType.replace("_", " ")}</span>
                                </span>
                                <ChevronDown size={14} className="text-gray-400 group-hover:text-primary transition-colors" aria-hidden="true" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-full md:w-48">
                            <DropdownMenuItem onClick={() => setFilterType("ALL")}>All Types</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterType("AUTO_TRADE")}>Auto Trade</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterType("MANUAL_ASSIST")}>Manual Assist</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterType("INDICATOR")}>Indicator</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Content Section - Data Table Card */}
            <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm flex flex-col relative w-full flex-1">
                {/* Empty State */}
                {sortedProducts.length === 0 ? (
                    <div className="text-center py-24 bg-white dark:bg-[#1E2028] rounded-xl">
                        <div className="w-20 h-20 mx-auto bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Bot size={40} className="text-gray-300 dark:text-gray-600" aria-hidden="true" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Products Found</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            {searchTerm || filterType !== "ALL"
                                ? "Try adjusting your filters."
                                : "Create your first EA product to get started."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto custom-scrollbar flex-1">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-gray-50/50 dark:bg-white/5 text-xs uppercase text-gray-400 font-bold tracking-wider backdrop-blur-sm sticky top-0 z-10">
                                    <tr>
                                        <th className="px-8 py-4 border-b border-gray-200 dark:border-white/5 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort("name")}>
                                            <div className="flex items-center">Product <SortIcon field="name" /></div>
                                        </th>
                                        <th className="px-6 py-4 border-b border-gray-200 dark:border-white/5 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort("type")}>
                                            <div className="flex items-center">Type <SortIcon field="type" /></div>
                                        </th>
                                        <th className="px-6 py-4 border-b border-gray-200 dark:border-white/5 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort("version")}>
                                            <div className="flex items-center">Version <SortIcon field="version" /></div>
                                        </th>
                                        <th className="px-6 py-4 border-b border-gray-200 dark:border-white/5 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort("totalDownloads")}>
                                            <div className="flex items-center">Downloads <SortIcon field="totalDownloads" /></div>
                                        </th>
                                        <th className="px-6 py-4 border-b border-gray-200 dark:border-white/5 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort("isActive")}>
                                            <div className="flex items-center">Status <SortIcon field="isActive" /></div>
                                        </th>
                                        <th className="px-6 py-4 border-b border-gray-200 dark:border-white/5 text-right w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {sortedProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors group">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-sm border border-gray-100 dark:border-white/5 group-hover:shadow-md transition-all">
                                                        {product.thumbnail ? (
                                                            <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        ) : (
                                                            <Bot size={20} className="text-gray-400" aria-hidden="true" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white text-base group-hover:text-primary transition-colors">{product.name}</p>
                                                        <p className="text-xs text-gray-600 mt-0.5">{format(new Date(product.createdAt), "dd MMM yyyy")}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-gray-100 dark:bg-white/10 px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest border border-gray-200 dark:border-white/5">
                                                    {product.type.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg text-xs font-bold font-mono">
                                                    v{product.version}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium text-sm">
                                                    <Download size={16} className="text-gray-400" aria-hidden="true" />
                                                    {product.totalDownloads}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${product.isActive ? "bg-emerald-500 shadow-[0_0_8px_hsl(var(--primary))]" : "bg-gray-300 dark:bg-gray-600"}`} />
                                                    <span className={`text-sm font-medium ${product.isActive ? "text-gray-900 dark:text-gray-200" : "text-gray-600"}`}>
                                                        {product.isActive ? "Active" : "Disabled"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={`/admin/ea/products/${product.id}`}>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" aria-label={`Edit ${product.name}`}>
                                                            <Edit size={16} />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        onClick={() => confirmDelete(product.id)}
                                                        aria-label={`Delete ${product.name}`}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Placeholder */}
                        <div className="border-t border-gray-200 dark:border-white/5 py-3 px-6 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between text-sm text-gray-600">
                            <span>Showing 1 - {sortedProducts.length} of {sortedProducts.length} products</span>
                            <div className="flex items-center gap-2 opacity-50 pointer-events-none">
                                <Button variant="outline" size="sm" className="h-8 text-xs">Previous</Button>
                                <Button variant="outline" size="sm" className="h-8 text-xs">Next</Button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Product"
                description="Are you sure you want to delete this product? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsConfirmOpen(false);
                    setProductToDeleteId(null);
                }}
                variant="danger"
            />
        </div>
    );
}
