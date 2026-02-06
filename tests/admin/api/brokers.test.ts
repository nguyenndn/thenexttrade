/**
 * Brokers API Tests
 * @module tests/admin/api/brokers.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockBrokers } from '../__mocks__/data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// API helper functions
async function getBrokers(params: {
    isActive?: boolean;
    isFeatured?: boolean;
    search?: string;
    minRating?: number;
    page?: number;
    limit?: number;
} = {}) {
    const query = new URLSearchParams();
    if (params.isActive !== undefined) query.set('isActive', params.isActive.toString());
    if (params.isFeatured !== undefined) query.set('isFeatured', params.isFeatured.toString());
    if (params.search) query.set('search', params.search);
    if (params.minRating !== undefined) query.set('minRating', params.minRating.toString());
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const response = await fetch(`/api/admin/brokers?${query.toString()}`);
    return response.json();
}

async function getBrokerById(id: string) {
    const response = await fetch(`/api/admin/brokers/${id}`);
    return response.json();
}

async function getBrokerBySlug(slug: string) {
    const response = await fetch(`/api/admin/brokers/slug/${slug}`);
    return response.json();
}

async function createBroker(data: {
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    minDeposit?: number;
    leverage?: string;
    regulations?: string[];
    platforms?: string[];
}) {
    const response = await fetch('/api/admin/brokers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function updateBroker(id: string, data: {
    name?: string;
    description?: string;
    rating?: number;
    isActive?: boolean;
    isFeatured?: boolean;
}) {
    const response = await fetch(`/api/admin/brokers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function deleteBroker(id: string) {
    const response = await fetch(`/api/admin/brokers/${id}`, {
        method: 'DELETE',
    });
    return response.json();
}

async function toggleBrokerStatus(id: string, field: 'isActive' | 'isFeatured') {
    const response = await fetch(`/api/admin/brokers/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field }),
    });
    return response.json();
}

async function uploadBrokerLogo(id: string, file: File) {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await fetch(`/api/admin/brokers/${id}/logo`, {
        method: 'POST',
        body: formData,
    });
    return response.json();
}

async function getBrokerStats() {
    const response = await fetch('/api/admin/brokers/stats');
    return response.json();
}

async function reorderBrokers(brokerIds: string[]) {
    const response = await fetch('/api/admin/brokers/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brokerIds }),
    });
    return response.json();
}

async function bulkUpdateBrokers(brokerIds: string[], data: {
    isActive?: boolean;
    isFeatured?: boolean;
}) {
    const response = await fetch('/api/admin/brokers/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brokerIds, ...data }),
    });
    return response.json();
}

describe('Brokers API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // List Brokers Tests
    // ========================================
    describe('GET /api/admin/brokers', () => {
        it('should get all brokers', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        brokers: mockBrokers,
                        total: mockBrokers.length,
                        page: 1,
                        totalPages: 1,
                    },
                }),
            });

            const data = await getBrokers();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/brokers?');
            expect(data.success).toBe(true);
            expect(data.data.brokers).toEqual(mockBrokers);
        });

        it('should filter by active status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { brokers: [mockBrokers[0]], total: 1 },
                }),
            });

            await getBrokers({ isActive: true });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/brokers?isActive=true');
        });

        it('should filter by featured status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { brokers: mockBrokers.filter(b => b.isFeatured), total: 1 },
                }),
            });

            await getBrokers({ isFeatured: true });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/brokers?isFeatured=true');
        });

        it('should search by name', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { brokers: [mockBrokers[0]], total: 1 },
                }),
            });

            await getBrokers({ search: 'XM' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/brokers?search=XM');
        });

        it('should filter by minimum rating', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { brokers: mockBrokers.filter(b => b.rating >= 4.0), total: 2 },
                }),
            });

            await getBrokers({ minRating: 4.0 });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/brokers?minRating=4');
        });

        it('should paginate results', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { brokers: mockBrokers, total: 50, page: 2 },
                }),
            });

            await getBrokers({ page: 2, limit: 10 });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/brokers?page=2&limit=10');
        });

        it('should combine filters', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { brokers: [mockBrokers[0]], total: 1 },
                }),
            });

            await getBrokers({
                isActive: true,
                isFeatured: true,
                minRating: 4.5,
            });

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/admin/brokers?isActive=true&isFeatured=true&minRating=4.5'
            );
        });
    });

    // ========================================
    // Get Single Broker Tests
    // ========================================
    describe('GET /api/admin/brokers/:id', () => {
        it('should get broker by id', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockBrokers[0],
                }),
            });

            const data = await getBrokerById('broker-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/brokers/broker-1');
            expect(data.success).toBe(true);
            expect(data.data).toEqual(mockBrokers[0]);
        });

        it('should handle not found', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Broker not found',
                }),
            });

            const data = await getBrokerById('invalid');

            expect(data.success).toBe(false);
            expect(data.error).toBe('Broker not found');
        });
    });

    // ========================================
    // Get Broker by Slug Tests
    // ========================================
    describe('GET /api/admin/brokers/slug/:slug', () => {
        it('should get broker by slug', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockBrokers[0],
                }),
            });

            const data = await getBrokerBySlug('xm-trading');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/brokers/slug/xm-trading');
            expect(data.success).toBe(true);
        });
    });

    // ========================================
    // Create Broker Tests
    // ========================================
    describe('POST /api/admin/brokers', () => {
        const validData = {
            name: 'New Broker',
            slug: 'new-broker',
            description: 'Description',
            minDeposit: 100,
            leverage: '1:500',
            regulations: ['FCA', 'CySEC'],
            platforms: ['MT4', 'MT5'],
        };

        it('should create broker', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'new-broker', ...validData },
                }),
            });

            const data = await createBroker(validData);

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/brokers', {
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

            const data = await createBroker({ ...validData, name: '' });

            expect(data.success).toBe(false);
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

            const data = await createBroker(validData);

            expect(data.success).toBe(false);
        });

        it('should validate minDeposit is non-negative', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Minimum deposit must be non-negative',
                }),
            });

            const data = await createBroker({ ...validData, minDeposit: -50 });

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Update Broker Tests
    // ========================================
    describe('PATCH /api/admin/brokers/:id', () => {
        it('should update broker', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockBrokers[0], name: 'Updated Broker' },
                }),
            });

            const data = await updateBroker('broker-1', { name: 'Updated Broker' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/brokers/broker-1', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Updated Broker' }),
            });
            expect(data.success).toBe(true);
        });

        it('should update rating', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockBrokers[0], rating: 4.8 },
                }),
            });

            const data = await updateBroker('broker-1', { rating: 4.8 });

            expect(data.success).toBe(true);
        });

        it('should validate rating range', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Rating must be between 0 and 5',
                }),
            });

            const data = await updateBroker('broker-1', { rating: 6 });

            expect(data.success).toBe(false);
        });

        it('should toggle active status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockBrokers[0], isActive: false },
                }),
            });

            const data = await updateBroker('broker-1', { isActive: false });

            expect(data.success).toBe(true);
        });

        it('should toggle featured status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockBrokers[0], isFeatured: true },
                }),
            });

            const data = await updateBroker('broker-1', { isFeatured: true });

            expect(data.success).toBe(true);
        });
    });

    // ========================================
    // Delete Broker Tests
    // ========================================
    describe('DELETE /api/admin/brokers/:id', () => {
        it('should delete broker', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Broker deleted',
                }),
            });

            const data = await deleteBroker('broker-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/brokers/broker-1', {
                method: 'DELETE',
            });
            expect(data.success).toBe(true);
        });

        it('should handle not found', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Broker not found',
                }),
            });

            const data = await deleteBroker('invalid');

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Toggle Status Tests
    // ========================================
    describe('PATCH /api/admin/brokers/:id/toggle', () => {
        it('should toggle active status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockBrokers[0], isActive: false },
                }),
            });

            const data = await toggleBrokerStatus('broker-1', 'isActive');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/brokers/broker-1/toggle', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ field: 'isActive' }),
            });
            expect(data.success).toBe(true);
        });

        it('should toggle featured status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockBrokers[0], isFeatured: true },
                }),
            });

            const data = await toggleBrokerStatus('broker-1', 'isFeatured');

            expect(data.success).toBe(true);
        });
    });

    // ========================================
    // Logo Upload Tests
    // ========================================
    describe('POST /api/admin/brokers/:id/logo', () => {
        it('should upload logo', async () => {
            const file = new File([''], 'logo.png', { type: 'image/png' });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { logoUrl: '/uploads/brokers/logo.png' },
                }),
            });

            const data = await uploadBrokerLogo('broker-1', file);

            expect(mockFetch).toHaveBeenCalled();
            expect(data.success).toBe(true);
        });

        it('should validate file type', async () => {
            const file = new File([''], 'document.pdf', { type: 'application/pdf' });
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Invalid file type. Only images are allowed.',
                }),
            });

            const data = await uploadBrokerLogo('broker-1', file);

            expect(data.success).toBe(false);
        });

        it('should validate file size', async () => {
            const file = new File([''], 'large.png', { type: 'image/png' });
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'File size exceeds 2MB limit',
                }),
            });

            const data = await uploadBrokerLogo('broker-1', file);

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Stats Tests
    // ========================================
    describe('GET /api/admin/brokers/stats', () => {
        it('should get broker stats', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        totalBrokers: 10,
                        activeBrokers: 8,
                        featuredBrokers: 3,
                        averageRating: 4.2,
                    },
                }),
            });

            const data = await getBrokerStats();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/brokers/stats');
            expect(data.success).toBe(true);
            expect(data.data.totalBrokers).toBe(10);
        });
    });

    // ========================================
    // Reorder Tests
    // ========================================
    describe('PATCH /api/admin/brokers/reorder', () => {
        it('should reorder brokers', async () => {
            const newOrder = ['broker-2', 'broker-1', 'broker-3'];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Brokers reordered',
                }),
            });

            const data = await reorderBrokers(newOrder);

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/brokers/reorder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brokerIds: newOrder }),
            });
            expect(data.success).toBe(true);
        });
    });

    // ========================================
    // Bulk Update Tests
    // ========================================
    describe('PATCH /api/admin/brokers/bulk-update', () => {
        it('should bulk update active status', async () => {
            const brokerIds = ['broker-1', 'broker-2'];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    updatedCount: 2,
                }),
            });

            const data = await bulkUpdateBrokers(brokerIds, { isActive: true });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/brokers/bulk-update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brokerIds, isActive: true }),
            });
            expect(data.success).toBe(true);
        });

        it('should bulk update featured status', async () => {
            const brokerIds = ['broker-1', 'broker-2'];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    updatedCount: 2,
                }),
            });

            const data = await bulkUpdateBrokers(brokerIds, { isFeatured: false });

            expect(data.success).toBe(true);
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

            const data = await getBrokers();

            expect(data.success).toBe(false);
        });

        it('should handle forbidden', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Insufficient permissions',
                }),
            });

            const data = await deleteBroker('broker-1');

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

            const data = await getBrokers();

            expect(data.success).toBe(false);
        });

        it('should handle network error', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(getBrokers()).rejects.toThrow('Network error');
        });
    });
});
