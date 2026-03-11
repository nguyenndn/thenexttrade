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
            {/* Premium Filters Card - Completely Separated */}
            <Card className="p-5 mb-8 bg-white dark:bg-[#1E2028] border border-gray-100 dark:border-white/5 rounded-xl shadow-xl shadow-gray-100/50 dark:shadow-none flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
                {/* Search */}
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-x-0 -bottom-2 h-2 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                    <PremiumInput
                        icon={Search}
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="relative w-full md:w-48 bg-gray-50 dark:bg-black/20 hover:bg-white dark:hover:bg-[#1E2028] border border-transparent hover:border-gray-100 dark:hover:border-white/5 text-gray-700 dark:text-gray-200 shadow-sm justify-between group"
                                >
                                    {filterType === "ALL" ? "All Types" : filterType.replace("_", " ")}
                                    <Filter className="text-gray-400 group-hover:text-primary transition-colors" size={16} />
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
            </Card>

            {/* Content Section */}
            <div className="flex-1 relative">
                {/* Empty State */}
                {sortedProducts.length === 0 ? (
                    <div className="text-center py-24 bg-white dark:bg-[#1E2028] rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="w-20 h-20 mx-auto bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Bot size={40} className="text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Products Found</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm || filterType !== "ALL"
                                ? "Try adjusting your filters."
                                : "Create your first EA product to get started."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#1E2028] shadow-xl shadow-gray-100/50 dark:shadow-none">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50/50 dark:bg-white/5 text-xs uppercase text-gray-500 dark:text-gray-400 font-bold tracking-wider backdrop-blur-sm">
                                    <tr>
                                        <th className="px-8 py-5 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort("name")}>
                                            <div className="flex items-center">Product <SortIcon field="name" /></div>
                                        </th>
                                        <th className="px-6 py-5 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort("type")}>
                                            <div className="flex items-center">Type <SortIcon field="type" /></div>
                                        </th>
                                        <th className="px-6 py-5 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort("version")}>
                                            <div className="flex items-center">Version <SortIcon field="version" /></div>
                                        </th>
                                        <th className="px-6 py-5 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort("totalDownloads")}>
                                            <div className="flex items-center">Downloads <SortIcon field="totalDownloads" /></div>
                                        </th>
                                        <th className="px-6 py-5 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort("isActive")}>
                                            <div className="flex items-center">Status <SortIcon field="isActive" /></div>
                                        </th>
                                        <th className="px-6 py-5 text-right w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {sortedProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-sm border border-gray-100 dark:border-white/5 group-hover:shadow-md transition-all duration-300">
                                                        {product.thumbnail ? (
                                                            <img src={product.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        ) : (
                                                            <Bot size={24} className="text-gray-300 dark:text-gray-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white text-base group-hover:text-primary transition-colors">{product.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{format(new Date(product.createdAt), "dd MMM yyyy")}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-gray-100 dark:bg-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide border border-transparent group-hover:border-gray-200 dark:group-hover:border-white/10 transition-colors">
                                                    {product.type.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold font-mono">
                                                        v{product.version}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                                                    <Download size={16} className="text-gray-400" />
                                                    {product.totalDownloads}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${product.isActive ? "bg-primary shadow-[0_0_10px_hsl(var(--primary))]" : "bg-gray-300 dark:bg-gray-600"}`} />
                                                    <span className={`text-sm font-medium ${product.isActive ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>
                                                        {product.isActive ? "Active" : "Disabled"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/admin/ea/products/${product.id}`}>
                                                        <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl transition-colors">
                                                            <Edit size={18} />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-9 w-9 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                                                        onClick={() => confirmDelete(product.id)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
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
