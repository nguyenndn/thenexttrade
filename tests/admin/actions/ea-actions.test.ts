/**
 * EA Actions Tests
 * @module tests/admin/actions/ea-actions.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockEAProducts, mockLicenseAccounts } from '../__mocks__/data';
import { mockPrismaClient, mockAdminSession, mockUserSession, mockSupabaseClient } from '../__mocks__/helpers';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
    prisma: mockPrismaClient,
}));

// Mock supabase
vi.mock('@/lib/supabase/server', () => ({
    createClient: () => mockSupabaseClient,
}));

// Simulated EA Actions for testing
interface CreateProductInput {
    name: string;
    slug: string;
    type: 'AUTO_TRADE' | 'MANUAL_ASSIST' | 'INDICATOR';
    platform: 'MT4' | 'MT5';
    version: string;
    description: string;
}

interface UpdateProductInput extends Partial<CreateProductInput> {
    id: string;
}

async function createEAProduct(input: CreateProductInput, session: typeof mockAdminSession | null) {
    // Check authentication
    if (!session) {
        return { success: false, error: 'Unauthorized' };
    }

    // Check authorization
    if (session.user.role !== 'ADMIN') {
        return { success: false, error: 'Forbidden' };
    }

    // Validate input
    if (!input.name || input.name.trim().length < 3) {
        return { success: false, error: 'Name must be at least 3 characters' };
    }
    if (!input.slug || !/^[a-z0-9-]+$/.test(input.slug)) {
        return { success: false, error: 'Invalid slug format' };
    }
    if (!input.version || !/^\d+\.\d+\.\d+$/.test(input.version)) {
        return { success: false, error: 'Invalid version format (use x.x.x)' };
    }

    try {
        // Check for duplicate slug
        const existing = await mockPrismaClient.eAProduct.findUnique({
            where: { slug: input.slug },
        });
        if (existing) {
            return { success: false, error: 'Slug already exists' };
        }

        // Create product
        const product = await mockPrismaClient.eAProduct.create({
            data: {
                ...input,
                isActive: true,
                totalDownloads: 0,
            },
        });

        return { success: true, data: product };
    } catch (error) {
        return { success: false, error: 'Failed to create product' };
    }
}

async function updateEAProduct(input: UpdateProductInput, session: typeof mockAdminSession | null) {
    if (!session) {
        return { success: false, error: 'Unauthorized' };
    }

    if (session.user.role !== 'ADMIN') {
        return { success: false, error: 'Forbidden' };
    }

    try {
        const product = await mockPrismaClient.eAProduct.findUnique({
            where: { id: input.id },
        });

        if (!product) {
            return { success: false, error: 'Product not found' };
        }

        const updated = await mockPrismaClient.eAProduct.update({
            where: { id: input.id },
            data: input,
        });

        return { success: true, data: updated };
    } catch (error) {
        return { success: false, error: 'Failed to update product' };
    }
}

async function deleteEAProduct(productId: string, session: typeof mockAdminSession | null) {
    if (!session) {
        return { success: false, error: 'Unauthorized' };
    }

    if (session.user.role !== 'ADMIN') {
        return { success: false, error: 'Forbidden' };
    }

    try {
        // Check if product exists
        const product = await mockPrismaClient.eAProduct.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return { success: false, error: 'Product not found' };
        }

        // Check for active licenses
        const activeLicenses = await mockPrismaClient.licenseAccount.count({
            where: { productId, status: 'APPROVED' },
        });

        if (activeLicenses > 0) {
            return { success: false, error: 'Cannot delete product with active licenses' };
        }

        await mockPrismaClient.eAProduct.delete({
            where: { id: productId },
        });

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete product' };
    }
}

async function toggleProductStatus(productId: string, session: typeof mockAdminSession | null) {
    if (!session) {
        return { success: false, error: 'Unauthorized' };
    }

    if (session.user.role !== 'ADMIN') {
        return { success: false, error: 'Forbidden' };
    }

    try {
        const product = await mockPrismaClient.eAProduct.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return { success: false, error: 'Product not found' };
        }

        const updated = await mockPrismaClient.eAProduct.update({
            where: { id: productId },
            data: { isActive: !product.isActive },
        });

        return { success: true, data: updated };
    } catch (error) {
        return { success: false, error: 'Failed to toggle status' };
    }
}

async function approveLicense(licenseId: string, session: typeof mockAdminSession | null) {
    if (!session) {
        return { success: false, error: 'Unauthorized' };
    }

    if (session.user.role !== 'ADMIN') {
        return { success: false, error: 'Forbidden' };
    }

    try {
        const license = await mockPrismaClient.licenseAccount.findUnique({
            where: { id: licenseId },
        });

        if (!license) {
            return { success: false, error: 'License not found' };
        }

        if (license.status !== 'PENDING') {
            return { success: false, error: 'License is not pending' };
        }

        const updated = await mockPrismaClient.licenseAccount.update({
            where: { id: licenseId },
            data: { status: 'APPROVED', approvedAt: new Date() },
        });

        return { success: true, data: updated };
    } catch (error) {
        return { success: false, error: 'Failed to approve license' };
    }
}

async function rejectLicense(licenseId: string, reason: string, session: typeof mockAdminSession | null) {
    if (!session) {
        return { success: false, error: 'Unauthorized' };
    }

    if (session.user.role !== 'ADMIN') {
        return { success: false, error: 'Forbidden' };
    }

    if (!reason || reason.trim().length < 10) {
        return { success: false, error: 'Rejection reason must be at least 10 characters' };
    }

    try {
        const license = await mockPrismaClient.licenseAccount.findUnique({
            where: { id: licenseId },
        });

        if (!license) {
            return { success: false, error: 'License not found' };
        }

        if (license.status !== 'PENDING') {
            return { success: false, error: 'License is not pending' };
        }

        const updated = await mockPrismaClient.licenseAccount.update({
            where: { id: licenseId },
            data: { status: 'REJECTED', rejectionReason: reason },
        });

        return { success: true, data: updated };
    } catch (error) {
        return { success: false, error: 'Failed to reject license' };
    }
}

describe('EA Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Create Product Tests
    // ========================================
    describe('createEAProduct', () => {
        const validInput: CreateProductInput = {
            name: 'New EA Product',
            slug: 'new-ea-product',
            type: 'AUTO_TRADE',
            platform: 'MT5',
            version: '1.0.0',
            description: 'A new EA product',
        };

        it('should require authentication', async () => {
            const result = await createEAProduct(validInput, null);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('should require admin role', async () => {
            const result = await createEAProduct(validInput, mockUserSession);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Forbidden');
        });

        it('should validate name length', async () => {
            const result = await createEAProduct(
                { ...validInput, name: 'AB' },
                mockAdminSession
            );
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Name must be at least 3 characters');
        });

        it('should validate slug format', async () => {
            const result = await createEAProduct(
                { ...validInput, slug: 'Invalid Slug!' },
                mockAdminSession
            );
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid slug format');
        });

        it('should validate version format', async () => {
            const result = await createEAProduct(
                { ...validInput, version: 'v1.0' },
                mockAdminSession
            );
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid version format (use x.x.x)');
        });

        it('should check for duplicate slug', async () => {
            mockPrismaClient.eAProduct.findUnique.mockResolvedValue(mockEAProducts[0]);
            
            const result = await createEAProduct(validInput, mockAdminSession);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Slug already exists');
        });

        it('should create product successfully', async () => {
            mockPrismaClient.eAProduct.findUnique.mockResolvedValue(null);
            mockPrismaClient.eAProduct.create.mockResolvedValue({
                id: 'new-id',
                ...validInput,
                isActive: true,
                totalDownloads: 0,
            });
            
            const result = await createEAProduct(validInput, mockAdminSession);
            
            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty('id', 'new-id');
            expect(mockPrismaClient.eAProduct.create).toHaveBeenCalledWith({
                data: {
                    ...validInput,
                    isActive: true,
                    totalDownloads: 0,
                },
            });
        });
    });

    // ========================================
    // Update Product Tests
    // ========================================
    describe('updateEAProduct', () => {
        it('should require authentication', async () => {
            const result = await updateEAProduct({ id: 'ea-1', name: 'Updated' }, null);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('should return error for non-existent product', async () => {
            mockPrismaClient.eAProduct.findUnique.mockResolvedValue(null);
            
            const result = await updateEAProduct({ id: 'non-existent' }, mockAdminSession);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Product not found');
        });

        it('should update product successfully', async () => {
            mockPrismaClient.eAProduct.findUnique.mockResolvedValue(mockEAProducts[0]);
            mockPrismaClient.eAProduct.update.mockResolvedValue({
                ...mockEAProducts[0],
                name: 'Updated Name',
            });
            
            const result = await updateEAProduct(
                { id: 'ea-1', name: 'Updated Name' },
                mockAdminSession
            );
            
            expect(result.success).toBe(true);
            expect(result.data?.name).toBe('Updated Name');
        });
    });

    // ========================================
    // Delete Product Tests
    // ========================================
    describe('deleteEAProduct', () => {
        it('should require authentication', async () => {
            const result = await deleteEAProduct('ea-1', null);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('should return error for non-existent product', async () => {
            mockPrismaClient.eAProduct.findUnique.mockResolvedValue(null);
            
            const result = await deleteEAProduct('non-existent', mockAdminSession);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Product not found');
        });

        it('should prevent deletion with active licenses', async () => {
            mockPrismaClient.eAProduct.findUnique.mockResolvedValue(mockEAProducts[0]);
            mockPrismaClient.licenseAccount.count.mockResolvedValue(5);
            
            const result = await deleteEAProduct('ea-1', mockAdminSession);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Cannot delete product with active licenses');
        });

        it('should delete product successfully', async () => {
            mockPrismaClient.eAProduct.findUnique.mockResolvedValue(mockEAProducts[0]);
            mockPrismaClient.licenseAccount.count.mockResolvedValue(0);
            mockPrismaClient.eAProduct.delete.mockResolvedValue(mockEAProducts[0]);
            
            const result = await deleteEAProduct('ea-1', mockAdminSession);
            
            expect(result.success).toBe(true);
            expect(mockPrismaClient.eAProduct.delete).toHaveBeenCalledWith({
                where: { id: 'ea-1' },
            });
        });
    });

    // ========================================
    // Toggle Status Tests
    // ========================================
    describe('toggleProductStatus', () => {
        it('should require authentication', async () => {
            const result = await toggleProductStatus('ea-1', null);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('should toggle from active to inactive', async () => {
            mockPrismaClient.eAProduct.findUnique.mockResolvedValue({ ...mockEAProducts[0], isActive: true });
            mockPrismaClient.eAProduct.update.mockResolvedValue({ ...mockEAProducts[0], isActive: false });
            
            const result = await toggleProductStatus('ea-1', mockAdminSession);
            
            expect(result.success).toBe(true);
            expect(result.data?.isActive).toBe(false);
        });

        it('should toggle from inactive to active', async () => {
            mockPrismaClient.eAProduct.findUnique.mockResolvedValue({ ...mockEAProducts[0], isActive: false });
            mockPrismaClient.eAProduct.update.mockResolvedValue({ ...mockEAProducts[0], isActive: true });
            
            const result = await toggleProductStatus('ea-1', mockAdminSession);
            
            expect(result.success).toBe(true);
            expect(result.data?.isActive).toBe(true);
        });
    });

    // ========================================
    // Approve License Tests
    // ========================================
    describe('approveLicense', () => {
        it('should require authentication', async () => {
            const result = await approveLicense('license-1', null);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('should return error for non-existent license', async () => {
            mockPrismaClient.licenseAccount.findUnique.mockResolvedValue(null);
            
            const result = await approveLicense('non-existent', mockAdminSession);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('License not found');
        });

        it('should only approve pending licenses', async () => {
            mockPrismaClient.licenseAccount.findUnique.mockResolvedValue({
                ...mockLicenseAccounts[0],
                status: 'APPROVED',
            });
            
            const result = await approveLicense('license-1', mockAdminSession);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('License is not pending');
        });

        it('should approve license successfully', async () => {
            mockPrismaClient.licenseAccount.findUnique.mockResolvedValue(mockLicenseAccounts[1]); // PENDING
            mockPrismaClient.licenseAccount.update.mockResolvedValue({
                ...mockLicenseAccounts[1],
                status: 'APPROVED',
            });
            
            const result = await approveLicense('license-2', mockAdminSession);
            
            expect(result.success).toBe(true);
            expect(result.data?.status).toBe('APPROVED');
        });
    });

    // ========================================
    // Reject License Tests
    // ========================================
    describe('rejectLicense', () => {
        const validReason = 'Invalid account number provided';

        it('should require authentication', async () => {
            const result = await rejectLicense('license-1', validReason, null);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('should validate rejection reason length', async () => {
            const result = await rejectLicense('license-1', 'short', mockAdminSession);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Rejection reason must be at least 10 characters');
        });

        it('should only reject pending licenses', async () => {
            mockPrismaClient.licenseAccount.findUnique.mockResolvedValue({
                ...mockLicenseAccounts[0],
                status: 'APPROVED',
            });
            
            const result = await rejectLicense('license-1', validReason, mockAdminSession);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('License is not pending');
        });

        it('should reject license successfully', async () => {
            mockPrismaClient.licenseAccount.findUnique.mockResolvedValue(mockLicenseAccounts[1]); // PENDING
            mockPrismaClient.licenseAccount.update.mockResolvedValue({
                ...mockLicenseAccounts[1],
                status: 'REJECTED',
                rejectionReason: validReason,
            });
            
            const result = await rejectLicense('license-2', validReason, mockAdminSession);
            
            expect(result.success).toBe(true);
            expect(result.data?.status).toBe('REJECTED');
        });
    });
});
