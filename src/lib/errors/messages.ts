
import { ErrorCode } from "./ea-license";

export const ErrorMessages: Record<ErrorCode, string> = {
    // Account Errors
    ACCOUNT_ALREADY_REGISTERED: "You have already registered this account",
    ACCOUNT_BELONGS_TO_OTHER: "This account is already registered by another user",
    ACCOUNT_NOT_FOUND: "Account not found",
    ACCOUNT_ALREADY_APPROVED: "Account is already approved",
    ACCOUNT_ALREADY_REJECTED: "Account is already rejected",

    // Permission Errors
    UNAUTHORIZED: "Please log in",
    FORBIDDEN: "You do not have permission to perform this action",
    NOT_ADMIN: "Only admin can perform this action",

    // Download Errors
    NO_APPROVED_ACCOUNT: "You need at least one approved account to download EA",
    ALL_ACCOUNTS_EXPIRED: "All your accounts have expired",
    PRODUCT_NOT_FOUND: "Product not found",
    FILE_NOT_AVAILABLE: "File not available",

    // Validation Errors
    INVALID_ACCOUNT_NUMBER: "Invalid account number",
    INVALID_BROKER: "Invalid broker",
    REASON_REQUIRED: "Reason is required",
    ID_REQUIRED: "ID is required",

    // General Errors
    INTERNAL_ERROR: "An error occurred, please try again",
};
