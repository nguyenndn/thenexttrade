"use client";

import { useState, useMemo } from "react";
import { Bot, Search, ArrowUpDown, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { deleteEAProduct } from "@/app/admin/trading-systems/actions";
import { EAType } from "@prisma/client";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProductUsersModal } from "./ProductUsersModal";
import {
    AdminProductCard,
    type AdminProductItem,
} from "./AdminProductCard";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface ProductListProps {
    products: AdminProductItem[];
}

type SortField =
    | "createdAt"
    | "name"
    | "totalDownloads"
    | "farmCapital"
    | "isActive";

const SORT_LABELS: Record<SortField, string> = {
    createdAt: "Newest",
    name: "Name",
    totalDownloads: "Downloads",
    farmCapital: "Farm Capital",
    isActive: "Status",
};

export function ProductList({ products }: ProductListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<EAType | "ALL">("ALL");
    const [sortField, setSortField] = useState<SortField>("createdAt");

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [productToDeleteId, setProductToDeleteId] = useState<string | null>(
        null
    );
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedProductForUsers, setSelectedProductForUsers] =
        useState<AdminProductItem | null>(null);

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
        } catch (error: unknown) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to delete product"
            );
            setIsConfirmOpen(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch = product.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            const matchesType =
                filterType === "ALL" || product.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [products, searchTerm, filterType]);

    const sortedProducts = useMemo(() => {
        return [...filteredProducts].sort((a, b) => {
            if (sortField === "name") {
                return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            }
            if (sortField === "farmCapital") {
                const aCap =
                    a.farmStats?.confirmedFarmBalanceUSD ||
                    a.farmStats?.userPoolBalanceUSD ||
                    0;
                const bCap =
                    b.farmStats?.confirmedFarmBalanceUSD ||
                    b.farmStats?.userPoolBalanceUSD ||
                    0;
                return bCap - aCap;
            }
            if (sortField === "totalDownloads") {
                const aDl = a.totalDownloads || a._count?.downloads || 0;
                const bDl = b.totalDownloads || b._count?.downloads || 0;
                return bDl - aDl;
            }
            if (sortField === "isActive") {
                return Number(b.isActive) - Number(a.isActive);
            }
            return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
        });
    }, [filteredProducts, sortField]);

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar Card */}
            <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 mb-6">
                {/* Search */}
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50/80 dark:bg-[#151925] rounded-lg border border-gray-200 dark:border-white/10 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors flex-1 w-full max-w-md h-[38px]">
                    <Search
                        size={16}
                        className="text-gray-500"
                        aria-hidden="true"
                    />
                    <input
                        type="text"
                        aria-label="Search products"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent text-sm focus:outline-none w-full text-gray-700 dark:text-white"
                    />
                </div>

                {/* Filters & Sort */}
                <div className="flex flex-wrap gap-3 w-full md:w-auto md:ml-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="md"
                                className="h-[38px] flex items-center justify-between gap-2 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 w-full sm:w-48 group hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                                <span className="whitespace-nowrap flex items-center gap-1.5 font-medium">
                                    Type:{" "}
                                    <span className="text-primary font-bold">
                                        {filterType === "ALL"
                                            ? "All"
                                            : filterType.replace("_", " ")}
                                    </span>
                                </span>
                                <ChevronDown
                                    size={14}
                                    className="text-gray-500 group-hover:text-primary transition-colors"
                                    aria-hidden="true"
                                />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                                onClick={() => setFilterType("ALL")}
                            >
                                All Types
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setFilterType("AUTO_TRADE")}
                            >
                                Auto Trade
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setFilterType("SEMI_AUTO")}
                            >
                                Semi Auto
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setFilterType("MANUAL_ASSIST")}
                            >
                                Manual Assist
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setFilterType("INDICATOR")}
                            >
                                Indicator
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="md"
                                className="h-[38px] flex items-center justify-between gap-2 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 w-full sm:w-44 group hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                                <span className="whitespace-nowrap flex items-center gap-1.5 font-medium">
                                    <ArrowUpDown
                                        size={13}
                                        className="text-gray-500"
                                        aria-hidden="true"
                                    />
                                    <span className="text-primary font-bold">
                                        {SORT_LABELS[sortField]}
                                    </span>
                                </span>
                                <ChevronDown
                                    size={14}
                                    className="text-gray-500 group-hover:text-primary transition-colors"
                                    aria-hidden="true"
                                />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            {(Object.keys(SORT_LABELS) as SortField[]).map(
                                (field) => (
                                    <DropdownMenuItem
                                        key={field}
                                        onClick={() => setSortField(field)}
                                    >
                                        {SORT_LABELS[field]}
                                    </DropdownMenuItem>
                                )
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* 4-Column Grid Layout (Matching /dashboard/trading-systems) */}
            {sortedProducts.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#1E2028] rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10">
                    <div className="w-20 h-20 mx-auto bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Bot
                            size={40}
                            className="text-gray-300 dark:text-gray-600"
                            aria-hidden="true"
                        />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">
                        No Products Found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                        {searchTerm || filterType !== "ALL"
                            ? "Try adjusting your filters."
                            : "Create your first EA product to get started."}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                        {sortedProducts.map((product) => (
                            <AdminProductCard
                                key={product.id}
                                product={product}
                                onViewUsers={setSelectedProductForUsers}
                                onDelete={confirmDelete}
                            />
                        ))}
                    </div>

                    <div className="mt-6 text-xs font-mono tabular-nums text-gray-500 dark:text-gray-400">
                        Showing {sortedProducts.length} of {products.length}{" "}
                        products
                    </div>
                </>
            )}

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

            {/* Active Users & Licensees Modal */}
            <ProductUsersModal
                isOpen={!!selectedProductForUsers}
                onClose={() => setSelectedProductForUsers(null)}
                product={selectedProductForUsers}
            />
        </div>
    );
}
