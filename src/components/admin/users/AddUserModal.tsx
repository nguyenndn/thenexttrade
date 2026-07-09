"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Loader2, Mail, Lock, User, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createUser } from "@/app/admin/users/actions";
import { CountrySelect } from "@/components/ui/CountrySelect";

const addUserSchema = z
 .object({
 name: z.string().min(1, "Name is required").max(100),
 email: z.string().email("Invalid email address"),
 password: z.string().min(6, "Password must be at least 6 characters"),
 confirmPassword: z.string().min(1, "Please confirm the password"),
 role: z.enum(["USER", "EDITOR", "ADMIN"]),
 country: z.union([
 z.string().trim().regex(/^[A-Za-z]{2}$/, "Country must be a two-letter country code"),
 z.literal(""),
 ]).optional(),
 })
 .refine((data) => data.password === data.confirmPassword, {
 message: "Passwords do not match",
 path: ["confirmPassword"],
 });

type AddUserForm = z.infer<typeof addUserSchema>;

interface AddUserModalProps {
 isOpen: boolean;
 onClose: () => void;
}

export function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
 const router = useRouter();
 const [isLoading, setIsLoading] = useState(false);

 const {
 register,
 handleSubmit,
 reset,
 control,
 formState: { errors },
 } = useForm<AddUserForm>({
 resolver: zodResolver(addUserSchema),
 defaultValues: {
 name: "",
 email: "",
 password: "",
 confirmPassword: "",
 role: "USER",
 country: "",
 },
 });

 if (!isOpen) return null;

 const onSubmit = async (data: AddUserForm) => {
 setIsLoading(true);
 const result = await createUser(data);

 if (result.success) {
 toast.success("User created successfully");
 reset();
 router.refresh();
 onClose();
 } else {
 toast.error(result.error || "Failed to create user");
 }
 setIsLoading(false);
 };

 const handleClose = () => {
 reset();
 onClose();
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center">
 <div
 className="absolute inset-0 bg-black/50 backdrop-blur-sm"
 onClick={handleClose}
 />
 <div className="relative bg-white dark:bg-[#1E2028] rounded-2xl border border-dashboard shadow-2xl w-full max-w-lg mx-4 p-6">
 {/* Header */}
 <div className="flex items-center gap-3 mb-6">
 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
 <UserPlus size={20} className="text-primary" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-gray-700 dark:text-white">
 Add New User
 </h3>
 <p className="text-sm text-gray-500">
 Create a new account with a specific role
 </p>
 </div>
 </div>

 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
 {/* Name */}
 <div>
 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
 Full Name
 </label>
 <div className="relative">
 <User
 size={16}
 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
 />
 <input
 {...register("name")}
 placeholder="John Doe"
 className="w-full h-11 pl-10 pr-4 bg-gray-50 dark:bg-[#0B0E14] border border-dashboard rounded-xl text-sm text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
 />
 </div>
 {errors.name && (
 <p className="text-xs text-red-500 mt-1">
 {errors.name.message}
 </p>
 )}
 </div>

 {/* Email */}
 <div>
 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
 Email Address
 </label>
 <div className="relative">
 <Mail
 size={16}
 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
 />
 <input
 {...register("email")}
 type="email"
 placeholder="user@example.com"
 className="w-full h-11 pl-10 pr-4 bg-gray-50 dark:bg-[#0B0E14] border border-dashboard rounded-xl text-sm text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
 />
 </div>
 {errors.email && (
 <p className="text-xs text-red-500 mt-1">
 {errors.email.message}
 </p>
 )}
 </div>

 {/* Password Row */}
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
 Password
 </label>
 <div className="relative">
 <Lock
 size={16}
 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
 />
 <input
 {...register("password")}
 type="password"
 placeholder="••••••"
 className="w-full h-11 pl-10 pr-4 bg-gray-50 dark:bg-[#0B0E14] border border-dashboard rounded-xl text-sm text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
 />
 </div>
 {errors.password && (
 <p className="text-xs text-red-500 mt-1">
 {errors.password.message}
 </p>
 )}
 </div>
 <div>
 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
 Confirm Password
 </label>
 <div className="relative">
 <Lock
 size={16}
 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
 />
 <input
 {...register("confirmPassword")}
 type="password"
 placeholder="••••••"
 className="w-full h-11 pl-10 pr-4 bg-gray-50 dark:bg-[#0B0E14] border border-dashboard rounded-xl text-sm text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
 />
 </div>
 {errors.confirmPassword && (
 <p className="text-xs text-red-500 mt-1">
 {errors.confirmPassword.message}
 </p>
 )}
 </div>
 </div>

 {/* Role */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
 Role
 </label>
 <Controller
 control={control}
 name="role"
 render={({ field }) => (
 <Select onValueChange={field.onChange} defaultValue={field.value}>
 <SelectTrigger className="w-full h-11 px-4 bg-gray-50 dark:bg-[#0B0E14] border border-dashboard rounded-xl text-sm text-gray-700 dark:text-white focus:outline-none focus:border-primary/50 transition-colors">
 <SelectValue placeholder="Select a role" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="USER">User — Standard member</SelectItem>
 <SelectItem value="EDITOR">Editor — Articles &amp; Academy</SelectItem>
 <SelectItem value="ADMIN">Admin — Full access</SelectItem>
 </SelectContent>
 </Select>
 )}
 />
 </div>

 {/* Country */}
 <div>
 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
 Country
 </label>
 <Controller
 control={control}
 name="country"
 render={({ field }) => (
 <div className="relative">
 <Globe2
 size={16}
 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none"
 />
 <CountrySelect
 value={field.value}
 onChange={field.onChange}
 required={false}
 className="h-11 pl-10 bg-gray-50 dark:bg-[#0B0E14] text-sm"
 />
 </div>
 )}
 />
 {errors.country && (
 <p className="text-xs text-red-500 mt-1">
 {errors.country.message}
 </p>
 )}
 </div>
 </div>

 {/* Actions */}
 <div className="flex justify-end gap-3 pt-4 border-t border-dashboard">
 <Button
 type="button"
 variant="outline"
 size="smd"
 onClick={handleClose}
 disabled={isLoading}
 className="font-bold text-gray-600 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white"
 >
 Cancel
 </Button>
 <Button
 type="submit"
 variant="primary"
 size="smd"
 disabled={isLoading}
 className="min-w-[120px] font-bold"
 >
 {isLoading ? (
 <>
 <Loader2
 size={14}
 className="animate-spin mr-1.5"
 />
 Creating...
 </>
 ) : (
 <>
 <UserPlus size={14} className="mr-1.5" />
 Create User
 </>
 )}
 </Button>
 </div>
 </form>
 </div>
 </div>
 );
}
