import { describe, it, expect } from "vitest";
import { authSchema, passwordSchema, signupSchema } from "./auth";

describe("authSchema", () => {
    it("should validate correct input", () => {
        const input = {
            email: "test@example.com",
            password: "password123",
            fullName: "Test User",
        };
        const result = authSchema.safeParse(input);
        expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
        const input = {
            email: "invalid-email",
            password: "password123",
        };
        const result = authSchema.safeParse(input);
        expect(result.success).toBe(false);
    });

    it("should reject short password", () => {
        const input = {
            email: "test@example.com",
            password: "123",
        };
        const result = authSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].code).toBe("too_small");
        }
    });

    it("should validate input without optional fullName", () => {
        const input = {
            email: "test@example.com",
            password: "password123",
        };
        const result = authSchema.safeParse(input);
        expect(result.success).toBe(true);
    });

    it("should reject invalid email formats", () => {
        const invalidEmails = [
            "plainaddress",
            "#@%^%#$@#$@#.com",
            "@example.com",
            "email.example.com",
        ];
        invalidEmails.forEach((email) => {
            const result = authSchema.safeParse({
                email,
                password: "password123",
            });
            expect(result.success).toBe(false);
        });
    });

    it("should reject empty strings where required", () => {
        const result = authSchema.safeParse({ email: "", password: "" });
        expect(result.success).toBe(false);
    });

    it("should accept typical password complexity chars", () => {
        const result = authSchema.safeParse({
            email: "test@example.com",
            password: "Password!123",
        });
        expect(result.success).toBe(true);
    });
});

describe("passwordSchema", () => {
    it("rejects password shorter than 10 characters", () => {
        const result = passwordSchema.safeParse("Pass1");
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0]?.message).toBe(
                "Password must be at least 10 characters"
            );
        }
    });

    it("rejects password without lowercase letter", () => {
        const result = passwordSchema.safeParse("PASSWORD1234");
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0]?.message).toBe(
                "Password must contain a lowercase letter"
            );
        }
    });

    it("rejects password without uppercase letter", () => {
        const result = passwordSchema.safeParse("password1234");
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0]?.message).toBe(
                "Password must contain an uppercase letter"
            );
        }
    });

    it("rejects password without number", () => {
        const result = passwordSchema.safeParse("PasswordLong");
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0]?.message).toBe(
                "Password must contain a number"
            );
        }
    });

    it("accepts valid password with >=10 chars, lowercase, uppercase, and number", () => {
        const result = passwordSchema.safeParse("Password123");
        expect(result.success).toBe(true);
    });

    it("accepts valid password with special characters", () => {
        const result = passwordSchema.safeParse("SecurePass123!@#");
        expect(result.success).toBe(true);
    });

    it("rejects password longer than 128 characters", () => {
        const tooLong = "A1a".repeat(45); // 135 chars
        const result = passwordSchema.safeParse(tooLong);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0]?.message).toBe(
                "Password must be less than 128 characters"
            );
        }
    });
});

describe("signupSchema", () => {
    const validSignup = {
        email: "trader@example.com",
        password: "StrongPass123",
        confirm: "StrongPass123",
        fullName: "Jane Trader",
        termsAccepted: "on",
    };

    it("accepts valid signup input", () => {
        const result = signupSchema.safeParse(validSignup);
        expect(result.success).toBe(true);
    });

    it("rejects when passwords do not match", () => {
        const result = signupSchema.safeParse({
            ...validSignup,
            confirm: "DifferentPass123",
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0]?.message).toBe("Passwords do not match");
        }
    });

    it("rejects when terms are not accepted", () => {
        const result = signupSchema.safeParse({
            ...validSignup,
            termsAccepted: "",
        });
        expect(result.success).toBe(false);
    });
});

