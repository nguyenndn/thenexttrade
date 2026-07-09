"use client";

import { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { changeUserRole } from "@/app/admin/users/actions";

const ROLES = [
 {
 value: "USER",
 label: "User",
 description: "Standard member with no admin access",
 color: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400",
 },
 {
 value: "EDITOR",
 label: "Editor",
 description: "Can manage articles, academy, and media",
 color: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400",
 },
 {
 value: "ADMIN",
 label: "Admin",
 description: "Full access to all admin features",
 color: "bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400",
 },
];

interface ChangeRoleModalProps {
 isOpen: boolean;
 onClose: () => void;
 userId: string;
 userName: string;
 currentRole: string;
}

export function ChangeRoleModal({
 isOpen,
 onClose,
 userId,
 userName,
 currentRole,
}: ChangeRoleModalProps) {
 const router = useRouter();
 const [selectedRole, setSelectedRole] = useState(currentRole);
 const [isLoading, setIsLoading] = useState(false);

 if (!isOpen) return null;

 const handleSave = async () => {
 if (selectedRole === currentRole) {
 onClose();
 return;
 }

 setIsLoading(true);
 const result = await changeUserRole(userId, selectedRole);

 if (result.success) {
 toast.success(`Role updated to ${selectedRole}`);
 router.refresh();
 onClose();
 } else {
 toast.error(result.error || "Failed to update role");
 }
 setIsLoading(false);
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center">
 <div
 className="absolute inset-0 bg-black/50 backdrop-blur-sm"
 onClick={onClose}
 />
 <div className="relative bg-white dark:bg-[#1E2028] rounded-2xl border border-dashboard shadow-2xl w-full max-w-md mx-4 p-6">
 <div className="flex items-center gap-3 mb-6">
 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
 <ShieldCheck size={20} className="text-primary" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-gray-700 dark:text-white">
 Change Role
 </h3>
 <p className="text-sm text-gray-500">
 {userName}
 </p>
 </div>
 </div>

 <div className="space-y-3">
 {ROLES.map((role) => (
 <button
 key={role.value}
 type="button"
 onClick={() => setSelectedRole(role.value)}
 className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
 selectedRole === role.value
 ? "border-primary bg-primary/5 dark:bg-primary/5"
 : "border-dashboard hover:border-gray-300 dark:hover:border-white/20"
 }`}
 >
 <div
 className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
 selectedRole === role.value
 ? "border-primary"
 : "border-gray-300 dark:border-gray-600"
 }`}
 >
 {selectedRole === role.value && (
 <div className="w-2 h-2 rounded-full bg-primary" />
 )}
 </div>
 <div className="flex-1">
 <div className="flex items-center gap-2">
 <span className="font-bold text-sm text-gray-700 dark:text-white">
 {role.label}
 </span>
 {currentRole === role.value && (
 <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
 Current
 </span>
 )}
 </div>
 <p className="text-xs text-gray-500 mt-0.5">
 {role.description}
 </p>
 </div>
 </button>
 ))}
 </div>

 <div className="flex justify-end gap-3 mt-6">
 <Button
 variant="outline"
 size="smd"
 onClick={onClose}
 disabled={isLoading}
 className="font-bold"
 >
 Cancel
 </Button>
 <Button
 variant="primary"
 size="smd"
 onClick={handleSave}
 disabled={isLoading || selectedRole === currentRole}
 className="min-w-[100px] font-bold"
 >
 {isLoading ? (
 <Loader2 size={14} className="animate-spin" />
 ) : (
 "Save"
 )}
 </Button>
 </div>
 </div>
 </div>
 );
}
