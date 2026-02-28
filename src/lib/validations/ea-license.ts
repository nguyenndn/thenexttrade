
import { z } from "zod";

export const submitAccountSchema = z.object({
    broker: z.string().min(1, {
        message: "Please select a broker",
    }),
    accountNumber: z
        .string()
        .min(5, "Account number must be at least 5 characters")
        .max(20, "Account number is too long")
        .regex(/^\d+$/, "Account number must contain only digits"),
});

export const approveAccountSchema = z.object({
    expiryDate: z.date().optional(),
    note: z.string().max(500, "Note must be at most 500 characters").optional(),
});

export const rejectAccountSchema = z.object({
    reason: z.string().min(1, "Please enter a reason for rejection").max(500, "Reason must be at most 500 characters"),
});

export const createEAProductSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().optional(),
    type: z.enum(["AUTO_TRADE", "MANUAL_ASSIST", "INDICATOR"]),
    platform: z.enum(["MT4", "MT5", "BOTH"]),
    version: z.string().default("1.0.0"),
    changelog: z.string().optional(),
    isActive: z.boolean().default(true),
});

export const updateEAProductSchema = createEAProductSchema.partial();

export const uploadVersionSchema = z.object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must be in format x.y.z (e.g., 1.0.0)"),
    changelog: z.string().optional(),
});
