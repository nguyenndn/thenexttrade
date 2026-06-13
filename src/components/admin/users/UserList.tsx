"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import {
 Search,
 CheckSquare,
 Square,
 ChevronLeft,
 ChevronRight,
 ChevronDown,
 Users,
 Mail,
 ShieldCheck,
 Trash2,
 Globe2,
} from "lucide-react";
import {
 DropdownMenu,
 DropdownMenuTrigger,
 DropdownMenuContent,
 DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { UserRowActions } from "./UserRowActions";
import { bulkDeleteUsers } from "@/app/admin/users/actions";
import Link from "next/link";
import { countries } from "@/lib/data/countries";
import { getCountryName, normalizeCountryCode } from "@/lib/country-utils";

// =============================================================================
// TYPES
// =============================================================================

interface UserItem {
 id: string;
 name: string | null;
 email: string | null;
 image: string | null;
 createdAt: Date;
 profile: { role: string; country: string | null } | null;
 _count: {
 quizAttempts: number;
 progress: number;
 };
}

interface UserListProps {
 initialUsers: UserItem[];
 pagination: {
 currentPage: number;
 totalPages: number;
 };
 countryOptions: Array<{ country: string; name?: string; value: number }>;
}

// =============================================================================
// ROLE BADGE
// =============================================================================

const ROLE_STYLES: Record<string, string> = {
 ADMIN: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
 EDITOR: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
 USER: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400",
};

function RoleBadge({ role }: { role: string }) {
 return (
 <span
 className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
 ROLE_STYLES[role] || ROLE_STYLES.USER
 }`}
 >
 <ShieldCheck size={12} />
 {role}
 </span>
 );
}

// =============================================================================
// ROLE FILTER OPTIONS
// =============================================================================

const ROLE_OPTIONS = [
 { label: "All Roles", value: "" },
 { label: "Admin", value: "ADMIN" },
 { label: "Editor", value: "EDITOR" },
 { label: "User", value: "USER" },
];

function CountryDisplay({ country }: { country?: string | null }) {
 const code = normalizeCountryCode(country);

 if (!code) {
 return (
 <div className="flex items-center gap-2 text-gray-400">
 <Globe2 size={15} />
 <span className="text-sm font-medium">Unknown</span>
 </div>
 );
 }

 return (
 <div className="flex min-w-0 items-center gap-2">
 <img
 src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3/${code.toLowerCase()}.svg`}
 alt={getCountryName(code)}
 className="h-4 w-6 shrink-0 rounded-sm object-cover shadow-sm"
 />
 <span className="truncate text-sm font-bold text-gray-700 dark:text-white">
 {getCountryName(code)}
 </span>
 </div>
 );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function UserList({ initialUsers, pagination, countryOptions }: UserListProps) {
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();

 const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
 const [isBulkDeleting, setIsBulkDeleting] = useState(false);
 const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

 // Current filter values from URL
 const currentQuery = searchParams.get("q") || "";
 const currentRole = searchParams.get("role") || "";
 const currentCountry = normalizeCountryCode(searchParams.get("country")) || "";
 const currentPage = pagination.currentPage;

 const countryFilterOptions = useMemo(() => {
 const options = new Map<string, string>();
 countryOptions.forEach((country) => {
 const code = normalizeCountryCode(country.country);
 if (code) options.set(code, country.name || getCountryName(code));
 });

 if (currentCountry && !options.has(currentCountry)) {
 const country = countries.find((item) => item.code === currentCountry);
 options.set(currentCountry, country?.name || getCountryName(currentCountry));
 }

 return Array.from(options.entries()).map(([value, label]) => ({ value, label }));
 }, [countryOptions, currentCountry]);

 // ─── URL Update Helper ─────────────────────────────────────────
 const updateURL = useCallback(
 (params: Record<string, string>) => {
 const sp = new URLSearchParams(searchParams.toString());
 Object.entries(params).forEach(([key, value]) => {
 if (value) {
 sp.set(key, value);
 } else {
 sp.delete(key);
 }
 });
 // Reset to page 1 when filters change
 if (!params.page) {
 sp.delete("page");
 }
 router.push(`${pathname}?${sp.toString()}`);
 },
 [router, pathname, searchParams]
 );

 // ─── Search (debounced) ────────────────────────────────────────
 const debouncedSearch = useDebouncedCallback((value: string) => {
 updateURL({ q: value, page: "" });
 }, 300);

 // ─── Selection ─────────────────────────────────────────────────
 const toggleSelect = (id: string) => {
 setSelectedIds((prev) => {
 const next = new Set(prev);
 if (next.has(id)) next.delete(id);
 else next.add(id);
 return next;
 });
 };

 const toggleAll = () => {
 if (selectedIds.size === initialUsers.length) {
 setSelectedIds(new Set());
 } else {
 setSelectedIds(new Set(initialUsers.map((u) => u.id)));
 }
 };

 const isAllSelected =
 initialUsers.length > 0 && selectedIds.size === initialUsers.length;

 // ─── Bulk Delete ───────────────────────────────────────────────
 const handleBulkDelete = async () => {
 setIsBulkDeleting(true);
 const ids = Array.from(selectedIds);
 const result = await bulkDeleteUsers(ids);

 if (result.success) {
 toast.success(`Deleted ${result.deleted} user(s)`);
 setSelectedIds(new Set());
 router.refresh();
 } else {
 toast.error(result.error || "Failed to delete users");
 }
 setIsBulkDeleting(false);
 setIsBulkConfirmOpen(false);
 };

 // ─── Render ────────────────────────────────────────────────────
 return (
 <div className="bg-white dark:bg-[#0B0E14] border border-dashboard rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
 {/* Toolbar */}
 <div className="p-4 border-b border-dashboard">
 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
 {/* Search */}
 <div className="flex-1 w-full sm:max-w-xs">
 <PremiumInput
 placeholder="Search by name or email..."
 defaultValue={currentQuery}
 onChange={(e) => debouncedSearch(e.target.value)}
 icon={Search}
 />
 </div>

 {/* Role Filter */}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="outline"
 className="rounded-xl text-sm font-medium h-10 px-4"
 >
 <ShieldCheck size={14} className="mr-2" />
 {currentRole
 ? ROLE_OPTIONS.find(
 (r) => r.value === currentRole
 )?.label
 : "All Roles"}
 <ChevronDown size={14} className="ml-2" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent
 align="start"
 className="w-36 rounded-xl"
 >
 {ROLE_OPTIONS.map((opt) => (
 <DropdownMenuItem
 key={opt.value}
 onClick={() =>
 updateURL({
 role: opt.value,
 page: "",
 })
 }
 className={`font-medium cursor-pointer rounded-lg mx-1 my-0.5 ${
 currentRole === opt.value
 ? "bg-primary/10 text-primary"
 : ""
 }`}
 >
 {opt.label}
 </DropdownMenuItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>

 {/* Country Filter */}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="outline"
 className="rounded-xl text-sm font-medium h-10 px-4"
 >
 <Globe2 size={14} className="mr-2" />
 {currentCountry ? getCountryName(currentCountry) : "All Countries"}
 <ChevronDown size={14} className="ml-2" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent
 align="start"
 className="w-52 rounded-xl"
 >
 <DropdownMenuItem
 onClick={() => updateURL({ country: "", page: "" })}
 className={`font-medium cursor-pointer rounded-lg mx-1 my-0.5 ${
 !currentCountry ? "bg-primary/10 text-primary" : ""
 }`}
 >
 All Countries
 </DropdownMenuItem>
 {countryFilterOptions.map((opt) => (
 <DropdownMenuItem
 key={opt.value}
 onClick={() =>
 updateURL({
 country: opt.value,
 page: "",
 })
 }
 className={`font-medium cursor-pointer rounded-lg mx-1 my-0.5 ${
 currentCountry === opt.value
 ? "bg-primary/10 text-primary"
 : ""
 }`}
 >
 <img
 src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3/${opt.value.toLowerCase()}.svg`}
 alt={opt.label}
 className="mr-2 h-4 w-6 shrink-0 rounded-sm object-cover shadow-sm"
 />
 {opt.label}
 </DropdownMenuItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>

 {/* Bulk Actions */}
 {selectedIds.size > 0 && (
 <Button
 variant="outline"
 onClick={() => setIsBulkConfirmOpen(true)}
 className="rounded-xl text-sm font-medium h-10 px-4 text-red-500 border-red-200 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10"
 >
 <Trash2 size={14} className="mr-2" />
 Delete ({selectedIds.size})
 </Button>
 )}
 </div>
 </div>

 {/* Table */}
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-dashboard text-xs uppercase text-gray-500 font-bold tracking-wider">
 <th className="px-4 py-4 w-12">
 <Button
 variant="ghost"
 size="icon"
 onClick={toggleAll}
 className="w-auto h-auto p-0 text-gray-400 hover:bg-transparent hover:text-primary"
 aria-label="Select all"
 >
 {isAllSelected ? (
 <CheckSquare
 size={18}
 className="text-primary"
 />
 ) : (
 <Square size={18} />
 )}
 </Button>
 </th>
 <th className="px-4 py-4">User</th>
 <th className="px-4 py-4">Role</th>
 <th className="px-4 py-4">Country</th>
 <th className="px-4 py-4">Joined</th>
 <th className="px-4 py-4">Activity</th>
 <th className="px-4 py-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-dashboard">
 {initialUsers.map((user) => {
 const role = user.profile?.role || "USER";
 const isSelected = selectedIds.has(user.id);

 return (
 <tr
 key={user.id}
 className={`group transition-colors ${
 isSelected
 ? "bg-primary/5 dark:bg-primary/5"
 : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
 }`}
 >
 {/* Checkbox */}
 <td className="px-4 py-4">
 <Button
 variant="ghost"
 size="icon"
 onClick={() =>
 toggleSelect(user.id)
 }
 className="w-auto h-auto p-0 text-gray-400 hover:bg-transparent hover:text-primary"
 aria-label={`Select ${user.name}`}
 >
 {isSelected ? (
 <CheckSquare
 size={18}
 className="text-primary"
 />
 ) : (
 <Square size={18} />
 )}
 </Button>
 </td>

 {/* User Info */}
 <td className="px-4 py-4">
 <div className="flex items-center gap-3">
 <Avatar className="w-9 h-9 border border-dashboard">
 <AvatarImage
 src={user.image || ""}
 alt={
 user.name || "User"
 }
 />
 <AvatarFallback className="bg-gradient-to-tr from-cyan-400 to-blue-500 text-white font-bold text-xs">
 {user.name?.[0]?.toUpperCase() || (
 <Users size={14} />
 )}
 </AvatarFallback>
 </Avatar>
 <div className="min-w-0">
 <Link
 href={`/admin/users/${user.id}`}
 className="font-bold text-sm text-gray-700 dark:text-white hover:text-primary hover:underline line-clamp-1"
 >
 {user.name ||
 "Unnamed User"}
 </Link>
 <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
 <Mail size={11} />
 {user.email}
 </p>
 </div>
 </div>
 </td>

 {/* Role */}
 <td className="px-4 py-4">
 <RoleBadge role={role} />
 </td>

 {/* Country */}
 <td className="px-4 py-4 min-w-[170px]">
 <CountryDisplay country={user.profile?.country} />
 </td>

 {/* Joined */}
 <td className="px-4 py-4">
 <div className="flex flex-col">
 <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
 {new Date(
 user.createdAt
 ).toLocaleDateString(
 "en-US",
 {
 month: "short",
 day: "numeric",
 year: "numeric",
 }
 )}
 </span>
 <span className="text-xs text-gray-400">
 {new Date(
 user.createdAt
 ).toLocaleTimeString(
 "en-US",
 {
 hour: "2-digit",
 minute: "2-digit",
 }
 )}
 </span>
 </div>
 </td>

 {/* Activity */}
 <td className="px-4 py-4">
 <div className="flex gap-2">
 <div className="flex flex-col items-center min-w-[52px] px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-dashboard">
 <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
 Lessons
 </span>
 <span className="text-sm font-bold text-gray-700 dark:text-white">
 {user._count.progress}
 </span>
 </div>
 <div className="flex flex-col items-center min-w-[52px] px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-dashboard">
 <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
 Quizzes
 </span>
 <span className="text-sm font-bold text-gray-700 dark:text-white">
 {user._count.quizAttempts}
 </span>
 </div>
 </div>
 </td>

 {/* Actions */}
 <td className="px-4 py-4 text-right">
 <UserRowActions
 user={{
 id: user.id,
 name: user.name,
 email: user.email,
 role,
 }}
 />
 </td>
 </tr>
 );
 })}

 {initialUsers.length === 0 && (
 <tr>
 <td
 colSpan={7}
 className="px-6 py-16 text-center"
 >
 <Users
 size={40}
 className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
 />
 <p className="text-gray-500 font-medium">
 No users found
 </p>
 <p className="text-sm text-gray-400 mt-1">
 Try adjusting your search or filters
 </p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 {pagination.totalPages > 1 && (
 <div className="flex items-center justify-between px-6 py-4 border-t border-dashboard">
 <p className="text-sm text-gray-500">
 Page {currentPage} of {pagination.totalPages}
 </p>
 <div className="flex gap-2">
 <Button
 variant="outline"
 size="sm"
 disabled={currentPage <= 1}
 onClick={() =>
 updateURL({
 page: String(currentPage - 1),
 })
 }
 className="rounded-xl h-9 px-3"
 >
 <ChevronLeft size={14} className="mr-1" />
 Previous
 </Button>
 <Button
 variant="outline"
 size="sm"
 disabled={
 currentPage >= pagination.totalPages
 }
 onClick={() =>
 updateURL({
 page: String(currentPage + 1),
 })
 }
 className="rounded-xl h-9 px-3"
 >
 Next
 <ChevronRight size={14} className="ml-1" />
 </Button>
 </div>
 </div>
 )}

 {/* Bulk Delete Confirm */}
 <ConfirmDialog
 isOpen={isBulkConfirmOpen}
 title="Delete Selected Users"
 description={`Are you sure you want to delete ${selectedIds.size} user(s)? This will permanently remove their accounts and all associated data. This action cannot be undone.`}
 confirmText="Delete All"
 cancelText="Cancel"
 isLoading={isBulkDeleting}
 onConfirm={handleBulkDelete}
 onCancel={() => setIsBulkConfirmOpen(false)}
 variant="danger"
 />
 </div>
 );
}
