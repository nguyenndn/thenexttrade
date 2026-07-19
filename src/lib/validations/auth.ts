import { z } from "zod";

export const passwordSchema = z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number");

export const authSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    fullName: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must be less than 50 characters")
        .regex(
            /^[a-zA-Z0-9\s]+$/,
            "Name can only contain letters, numbers and spaces"
        )
        .optional(),
});

export const signupSchema = z
    .object({
        email: z.string().trim().toLowerCase().email().max(254),
        password: passwordSchema,
        confirm: z.string(),
        fullName: z.string().trim().min(2).max(80),
        country: z
            .string()
            .trim()
            .regex(/^[A-Za-z]{2}$/, "Please select a valid country")
            .optional(),
        termsAccepted: z.literal("on", {
            message: "You must accept the terms and conditions",
        }),
    })
    .refine((data) => data.password === data.confirm, {
        path: ["confirm"],
        message: "Passwords do not match",
    });
