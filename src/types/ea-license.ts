
import { AccountStatus, EAType, PlatformType } from "@prisma/client";
import { ErrorCode } from "@/lib/errors/ea-license";

// ============================================
// EA License TYPES
// ============================================

export interface EALicenseBase {
    broker: string;
    accountNumber: string;
}

export interface EALicense extends EALicenseBase {
    id: string;
    userId: string;
    status: AccountStatus;
    startDate: Date | null;
    expiryDate: Date | null;
    note: string | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    rejectedBy: string | null;
    rejectedAt: Date | null;
    rejectReason: string | null;
    isVerified: boolean;
    verifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface EALicenseWithUser extends EALicense {
    user: {
        id: string;
        email: string | null;
        name: string | null;
        image: string | null;
        createdAt: Date;
    };
}

// Form Inputs
export interface SubmitAccountInput {
    broker: string;
    accountNumber: string;
}

export interface ApproveAccountInput {
    expiryDate?: Date;
    note?: string;
}

export interface RejectAccountInput {
    reason: string;
}

// ============================================
// EA PRODUCT TYPES
// ============================================

export interface EAProductBase {
    name: string;
    slug: string;
    description: string | null;
    type: EAType;
    platform: PlatformType;
}

export interface EAProduct extends EAProductBase {
    id: string;
    fileMT4: string | null;
    fileMT5: string | null;
    thumbnail: string | null;
    version: string;
    changelog: string | null;
    isActive: boolean;
    totalDownloads: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateEAProductInput {
    name: string;
    slug: string;
    description?: string;
    type: EAType;
    platform: PlatformType;
    version?: string;
    changelog?: string;
}

export interface UpdateEAProductInput extends Partial<CreateEAProductInput> {
    isActive?: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = void> {
    success: boolean;
    data?: T;
    error?: string;
    errorCode?: ErrorCode;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// ============================================
// STATS TYPES
// ============================================

export interface EAStats {
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    productsCount: number;
    totalDownloads: number;
}
