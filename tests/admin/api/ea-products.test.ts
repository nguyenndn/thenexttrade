/**
 * EA Products API Tests
 * @module tests/admin/api/ea-products.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockEAProducts, mockLicenseAccounts } from '../__mocks__/data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// API helper functions
async function getEAProducts(params: {
    type?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
} = {}) {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.isActive !== undefined) query.set('isActive', params.isActive.toString());
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const response = await fetch(`/api/admin/ea/products?${query.toString()}`);
    return response.json();
}

async function getEAProductById(id: string) {
    const response = await fetch(`/api/admin/ea/products/${id}`);
    return response.json();
}

async function createEAProduct(data: {
    name: string;
    slug: string;
    type: string;
    platform: string;
    version: string;
    description?: string;
}) {
    const response = await fetch('/api/admin/ea/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function updateEAProduct(id: string, data: {
    name?: string;
    version?: string;
    isActive?: boolean;
}) {
    const response = await fetch(`/api/admin/ea/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function deleteEAProduct(id: string) {
    const response = await fetch(`/api/admin/ea/products/${id}`, {
        method: 'DELETE',
    });
    return response.json();
}

async function getLicenseAccounts(params: {
    status?: string;
    productId?: string;
    page?: number;
    limit?: number;
} = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.productId) query.set('productId', params.productId);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const response = await fetch(`/api/admin/ea/accounts?${query.toString()}`);
    return response.json();
}

async function approveLicense(id: string) {
    const response = await fetch(`/api/admin/ea/accounts/${id}/approve`, {
        method: 'POST',
    });
    return response.json();
}

async function rejectLicense(id: string, reason: string) {
    const response = await fetch(`/api/admin/ea/accounts/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
    });
    return response.json();
}

async function revokeLicense(id: string, reason: string) {
    const response = await fetch(`/api/admin/ea/accounts/${id}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
    });
    return response.json();
}

describe('EA Products API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // List Products Tests
    // ========================================
    describe('GET /api/admin/ea/products', () => {
        it('should get all EA products', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        products: mockEAProducts,
                        total: mockEAProducts.length,
                    },
                }),
            });

            const data = await getEAProducts();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/ea/products?');
            expect(data.success).toBe(true);
            expect(data.data.products).toEqual(mockEAProducts);
        });

        it('should filter by type', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { products: [mockEAProducts[0]], total: 1 },
                }),
            });

            await getEAProducts({ type: 'AUTO_TRADE' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/ea/products?type=AUTO_TRADE');
        });

        it('should filter by active status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { products: mockEAProducts.filter(p => p.isActive), total: 2 },
                }),
            });

            await getEAProducts({ isActive: true });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/ea/products?isActive=true');
        });

        it('should search by name', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { products: [mockEAProducts[0]], total: 1 },
                }),
            });

            await getEAProducts({ search: 'Scalper' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/ea/products?search=Scalper');
        });

        it('should paginate results', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { products: mockEAProducts, total: 50, page: 2 },
                }),
            });

            await getEAProducts({ page: 2, limit: 10 });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/ea/products?page=2&limit=10');
        });
    });

    // ========================================
    // Get Single Product Tests
    // ========================================
    describe('GET /api/admin/ea/products/:id', () => {
        it('should get product by id', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockEAProducts[0],
                }),
            });

            const data = await getEAProductById('ea-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/ea/products/ea-1');
            expect(data.success).toBe(true);
            expect(data.data).toEqual(mockEAProducts[0]);
        });

        it('should handle not found', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Product not found',
                }),
            });

            const data = await getEAProductById('invalid');

            expect(data.success).toBe(false);
            expect(data.error).toBe('Product not found');
        });
    });

    // ========================================
    // Create Product Tests
    // ========================================
    describe('POST /api/admin/ea/products', () => {
        const validData = {
            name: 'New EA',
            slug: 'new-ea',
            type: 'AUTO_TRADE',
            platform: 'MT5',
            version: '1.0.0',
            description: 'Description',
        };

        it('should create product', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'new-ea', ...validData },
                }),
            });

            const data = await createEAProduct(validData);

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/ea/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validData),
            });
            expect(data.success).toBe(true);
        });

        it('should handle validation errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Name is required',
                }),
            });

            const data = await createEAProduct({ ...validData, name: '' });

            expect(data.success).toBe(false);
            expect(data.error).toBe('Name is required');
        });

        it('should handle duplicate slug', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Slug already exists',
                }),
            });

            const data = await createEAProduct(validData);

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Update Product Tests
    // ========================================
    describe('PATCH /api/admin/ea/products/:id', () => {
        it('should update product', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockEAProducts[0], version: '2.6.0' },
                }),
            });

            const data = await updateEAProduct('ea-1', { version: '2.6.0' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/ea/products/ea-1', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ version: '2.6.0' }),
            });
            expect(data.success).toBe(true);
        });

        it('should toggle active status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockEAProducts[0], isActive: false },
                }),
            });

            const data = await updateEAProduct('ea-1', { isActive: false });

            expect(data.success).toBe(true);
        });
    });

    // ========================================
    // Delete Product Tests
    // ========================================
    describe('DELETE /api/admin/ea/products/:id', () => {
        it('should delete product', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Product deleted',
                }),
            });

            const data = await deleteEAProduct('ea-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/ea/products/ea-1', {
                method: 'DELETE',
            });
            expect(data.success).toBe(true);
        });

        it('should handle product with active licenses', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Cannot delete product with active licenses',
                }),
            });

            const data = await deleteEAProduct('ea-1');

            expect(data.success).toBe(false);
            expect(data.error).toBe('Cannot delete product with active licenses');
        });
    });
});

describe('License Accounts API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // List License Accounts Tests
    // ========================================
    describe('GET /api/admin/ea/accounts', () => {
        it('should get all license accounts', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        accounts: mockLicenseAccounts,
                        total: mockLicenseAccounts.length,
                    },
                }),
            });

            const data = await getLicenseAccounts();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/ea/accounts?');
            expect(data.success).toBe(true);
            expect(data.data.accounts).toEqual(mockLicenseAccounts);
        });

        it('should filter by status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { accounts: mockLicenseAccounts.filter(l => l.status === 'PENDING'), total: 1 },
                }),
            });

            await getLicenseAccounts({ status: 'PENDING' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/ea/accounts?status=PENDING');
        });

        it('should filter by product', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { accounts: mockLicenseAccounts.filter(l => l.productId === 'ea-1'), total: 2 },
                }),
            });

            await getLicenseAccounts({ productId: 'ea-1' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/ea/accounts?productId=ea-1');
        });

        it('should paginate results', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { accounts: mockLicenseAccounts, total: 100, page: 2 },
                }),
            });

            await getLicenseAccounts({ page: 2, limit: 20 });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/ea/accounts?page=2&limit=20');
        });
    });

    // ========================================
    // Approve License Tests
    // ========================================
    describe('POST /api/admin/ea/accounts/:id/approve', () => {
        it('should approve license', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockLicenseAccounts[1], status: 'APPROVED' },
                }),
            });

            const data = await approveLicense('license-2');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/ea/accounts/license-2/approve', {
                method: 'POST',
            });
            expect(data.success).toBe(true);
        });

        it('should handle already approved', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'License already approved',
                }),
            });

            const data = await approveLicense('license-1');

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Reject License Tests
    // ========================================
    describe('POST /api/admin/ea/accounts/:id/reject', () => {
        it('should reject license with reason', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockLicenseAccounts[1], status: 'REJECTED' },
                }),
            });

            const data = await rejectLicense('license-2', 'Invalid account number');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/ea/accounts/license-2/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Invalid account number' }),
            });
            expect(data.success).toBe(true);
        });

        it('should require rejection reason', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Rejection reason is required',
                }),
            });

            const data = await rejectLicense('license-2', '');

            expect(data.success).toBe(false);
            expect(data.error).toBe('Rejection reason is required');
        });
    });

    // ========================================
    // Revoke License Tests
    // ========================================
    describe('POST /api/admin/ea/accounts/:id/revoke', () => {
        it('should revoke license', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockLicenseAccounts[0], status: 'REVOKED' },
                }),
            });

            const data = await revokeLicense('license-1', 'Violation of terms');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/ea/accounts/license-1/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Violation of terms' }),
            });
            expect(data.success).toBe(true);
        });

        it('should only allow revoking approved licenses', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Only approved licenses can be revoked',
                }),
            });

            const data = await revokeLicense('license-2', 'Reason');

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Error Handling Tests
    // ========================================
    describe('Error Handling', () => {
        it('should handle unauthorized', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Unauthorized',
                }),
            });

            const data = await getLicenseAccounts();

            expect(data.success).toBe(false);
        });

        it('should handle server error', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Internal server error',
                }),
            });

            const data = await getEAProducts();

            expect(data.success).toBe(false);
        });
    });
});
