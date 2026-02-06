/**
 * Broker Actions Tests
 * @module tests/admin/actions/broker-actions.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockBrokers } from '../__mocks__/data';

// Mock Prisma
const mockPrisma = {
    broker: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
};

vi.mock('@/lib/prisma', () => ({
    default: mockPrisma,
}));

// Mock revalidatePath
const mockRevalidatePath = vi.fn();
vi.mock('next/cache', () => ({
    revalidatePath: mockRevalidatePath,
}));

// Types
interface BrokerInput {
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    rating?: number;
    minDeposit?: number;
    leverage?: string;
    regulations?: string[];
    platforms?: string[];
    isActive?: boolean;
    isFeatured?: boolean;
}

// Broker Actions
async function getBrokers(options: {
    isActive?: boolean;
    isFeatured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
}) {
    const where: Record<string, unknown> = {};

    if (options.isActive !== undefined) {
        where.isActive = options.isActive;
    }
    if (options.isFeatured !== undefined) {
        where.isFeatured = options.isFeatured;
    }
    if (options.search) {
        where.name = { contains: options.search, mode: 'insensitive' };
    }

    const brokers = await mockPrisma.broker.findMany({
        where,
        take: options.limit || 20,
        skip: options.offset || 0,
        orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }],
    });

    const total = await mockPrisma.broker.count({ where });

    return { success: true, data: { brokers, total } };
}

async function getBrokerById(id: string) {
    const broker = await mockPrisma.broker.findUnique({ where: { id } });

    if (!broker) {
        return { success: false, error: 'Broker not found' };
    }

    return { success: true, data: broker };
}

async function getBrokerBySlug(slug: string) {
    const broker = await mockPrisma.broker.findFirst({ where: { slug } });

    if (!broker) {
        return { success: false, error: 'Broker not found' };
    }

    return { success: true, data: broker };
}

async function createBroker(data: BrokerInput) {
    // Validation
    if (!data.name || data.name.length < 2) {
        return { success: false, error: 'Name must be at least 2 characters' };
    }
    if (!data.slug) {
        return { success: false, error: 'Slug is required' };
    }
    if (data.rating !== undefined && (data.rating < 0 || data.rating > 5)) {
        return { success: false, error: 'Rating must be between 0 and 5' };
    }
    if (data.minDeposit !== undefined && data.minDeposit < 0) {
        return { success: false, error: 'Min deposit cannot be negative' };
    }

    // Check slug uniqueness
    const existing = await mockPrisma.broker.findFirst({
        where: { slug: data.slug },
    });

    if (existing) {
        return { success: false, error: 'Slug already exists' };
    }

    const broker = await mockPrisma.broker.create({
        data: {
            ...data,
            isActive: data.isActive ?? true,
            isFeatured: data.isFeatured ?? false,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });

    mockRevalidatePath('/brokers');
    mockRevalidatePath('/admin/brokers');

    return { success: true, data: broker };
}

async function updateBroker(id: string, data: Partial<BrokerInput>) {
    const broker = await mockPrisma.broker.findUnique({ where: { id } });

    if (!broker) {
        return { success: false, error: 'Broker not found' };
    }

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== broker.slug) {
        const existing = await mockPrisma.broker.findFirst({
            where: { slug: data.slug, id: { not: id } },
        });
        if (existing) {
            return { success: false, error: 'Slug already exists' };
        }
    }

    // Validate rating
    if (data.rating !== undefined && (data.rating < 0 || data.rating > 5)) {
        return { success: false, error: 'Rating must be between 0 and 5' };
    }

    const updated = await mockPrisma.broker.update({
        where: { id },
        data: {
            ...data,
            updatedAt: new Date(),
        },
    });

    mockRevalidatePath('/brokers');
    mockRevalidatePath(`/brokers/${updated.slug}`);
    mockRevalidatePath('/admin/brokers');

    return { success: true, data: updated };
}

async function deleteBroker(id: string) {
    const broker = await mockPrisma.broker.findUnique({ where: { id } });

    if (!broker) {
        return { success: false, error: 'Broker not found' };
    }

    await mockPrisma.broker.delete({ where: { id } });

    mockRevalidatePath('/brokers');
    mockRevalidatePath('/admin/brokers');

    return { success: true };
}

async function toggleBrokerActive(id: string) {
    const broker = await mockPrisma.broker.findUnique({ where: { id } });

    if (!broker) {
        return { success: false, error: 'Broker not found' };
    }

    const updated = await mockPrisma.broker.update({
        where: { id },
        data: { isActive: !broker.isActive },
    });

    mockRevalidatePath('/brokers');
    return { success: true, data: updated };
}

async function toggleBrokerFeatured(id: string) {
    const broker = await mockPrisma.broker.findUnique({ where: { id } });

    if (!broker) {
        return { success: false, error: 'Broker not found' };
    }

    const updated = await mockPrisma.broker.update({
        where: { id },
        data: { isFeatured: !broker.isFeatured },
    });

    mockRevalidatePath('/brokers');
    return { success: true, data: updated };
}

async function updateBrokerRating(id: string, rating: number) {
    if (rating < 0 || rating > 5) {
        return { success: false, error: 'Rating must be between 0 and 5' };
    }

    const broker = await mockPrisma.broker.findUnique({ where: { id } });

    if (!broker) {
        return { success: false, error: 'Broker not found' };
    }

    const updated = await mockPrisma.broker.update({
        where: { id },
        data: { rating },
    });

    mockRevalidatePath('/brokers');
    return { success: true, data: updated };
}

describe('Broker Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma.broker.findMany.mockResolvedValue(mockBrokers);
        mockPrisma.broker.count.mockResolvedValue(mockBrokers.length);
    });

    // ========================================
    // Get Brokers Tests
    // ========================================
    describe('getBrokers', () => {
        it('should get all brokers', async () => {
            const result = await getBrokers({});

            expect(result.success).toBe(true);
            expect(result.data.brokers).toEqual(mockBrokers);
        });

        it('should filter by active status', async () => {
            await getBrokers({ isActive: true });

            expect(mockPrisma.broker.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { isActive: true },
                })
            );
        });

        it('should filter by featured status', async () => {
            await getBrokers({ isFeatured: true });

            expect(mockPrisma.broker.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { isFeatured: true },
                })
            );
        });

        it('should filter by search term', async () => {
            await getBrokers({ search: 'XM' });

            expect(mockPrisma.broker.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { name: { contains: 'XM', mode: 'insensitive' } },
                })
            );
        });

        it('should apply pagination', async () => {
            await getBrokers({ limit: 10, offset: 20 });

            expect(mockPrisma.broker.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 10,
                    skip: 20,
                })
            );
        });

        it('should order by featured and rating', async () => {
            await getBrokers({});

            expect(mockPrisma.broker.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }],
                })
            );
        });
    });

    // ========================================
    // Get Broker By ID Tests
    // ========================================
    describe('getBrokerById', () => {
        it('should get broker by id', async () => {
            mockPrisma.broker.findUnique.mockResolvedValueOnce(mockBrokers[0]);

            const result = await getBrokerById('broker-1');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockBrokers[0]);
        });

        it('should return error if not found', async () => {
            mockPrisma.broker.findUnique.mockResolvedValueOnce(null);

            const result = await getBrokerById('invalid');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Broker not found');
        });
    });

    // ========================================
    // Get Broker By Slug Tests
    // ========================================
    describe('getBrokerBySlug', () => {
        it('should get broker by slug', async () => {
            mockPrisma.broker.findFirst.mockResolvedValueOnce(mockBrokers[0]);

            const result = await getBrokerBySlug('xm-trading');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockBrokers[0]);
        });

        it('should return error if not found', async () => {
            mockPrisma.broker.findFirst.mockResolvedValueOnce(null);

            const result = await getBrokerBySlug('nonexistent');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Broker not found');
        });
    });

    // ========================================
    // Create Broker Tests
    // ========================================
    describe('createBroker', () => {
        const validData: BrokerInput = {
            name: 'New Broker',
            slug: 'new-broker',
            description: 'Description',
            rating: 4.5,
            minDeposit: 100,
        };

        beforeEach(() => {
            mockPrisma.broker.findFirst.mockResolvedValue(null);
            mockPrisma.broker.create.mockResolvedValue({
                id: 'new-broker',
                ...validData,
                isActive: true,
                isFeatured: false,
            });
        });

        it('should create broker', async () => {
            const result = await createBroker(validData);

            expect(result.success).toBe(true);
            expect(mockPrisma.broker.create).toHaveBeenCalled();
        });

        it('should set default active and featured', async () => {
            await createBroker(validData);

            expect(mockPrisma.broker.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    isActive: true,
                    isFeatured: false,
                }),
            });
        });

        it('should validate name length', async () => {
            const result = await createBroker({ ...validData, name: 'A' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Name must be at least 2 characters');
        });

        it('should require slug', async () => {
            const result = await createBroker({ ...validData, slug: '' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Slug is required');
        });

        it('should validate rating range', async () => {
            const result = await createBroker({ ...validData, rating: 6 });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Rating must be between 0 and 5');
        });

        it('should validate min deposit', async () => {
            const result = await createBroker({ ...validData, minDeposit: -10 });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Min deposit cannot be negative');
        });

        it('should check slug uniqueness', async () => {
            mockPrisma.broker.findFirst.mockResolvedValueOnce(mockBrokers[0]);

            const result = await createBroker(validData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Slug already exists');
        });

        it('should revalidate paths', async () => {
            await createBroker(validData);

            expect(mockRevalidatePath).toHaveBeenCalledWith('/brokers');
            expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/brokers');
        });
    });

    // ========================================
    // Update Broker Tests
    // ========================================
    describe('updateBroker', () => {
        beforeEach(() => {
            mockPrisma.broker.findUnique.mockResolvedValue(mockBrokers[0]);
            mockPrisma.broker.findFirst.mockResolvedValue(null);
            mockPrisma.broker.update.mockResolvedValue({
                ...mockBrokers[0],
                name: 'Updated Name',
            });
        });

        it('should update broker', async () => {
            const result = await updateBroker('broker-1', { name: 'Updated Name' });

            expect(result.success).toBe(true);
            expect(mockPrisma.broker.update).toHaveBeenCalled();
        });

        it('should return error if not found', async () => {
            mockPrisma.broker.findUnique.mockResolvedValueOnce(null);

            const result = await updateBroker('invalid', { name: 'Test' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Broker not found');
        });

        it('should check slug uniqueness on update', async () => {
            mockPrisma.broker.findFirst.mockResolvedValueOnce(mockBrokers[1]);

            const result = await updateBroker('broker-1', { slug: 'ic-markets' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Slug already exists');
        });

        it('should validate rating on update', async () => {
            const result = await updateBroker('broker-1', { rating: -1 });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Rating must be between 0 and 5');
        });
    });

    // ========================================
    // Delete Broker Tests
    // ========================================
    describe('deleteBroker', () => {
        beforeEach(() => {
            mockPrisma.broker.findUnique.mockResolvedValue(mockBrokers[0]);
            mockPrisma.broker.delete.mockResolvedValue(mockBrokers[0]);
        });

        it('should delete broker', async () => {
            const result = await deleteBroker('broker-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.broker.delete).toHaveBeenCalledWith({
                where: { id: 'broker-1' },
            });
        });

        it('should return error if not found', async () => {
            mockPrisma.broker.findUnique.mockResolvedValueOnce(null);

            const result = await deleteBroker('invalid');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Broker not found');
        });

        it('should revalidate paths', async () => {
            await deleteBroker('broker-1');

            expect(mockRevalidatePath).toHaveBeenCalledWith('/brokers');
            expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/brokers');
        });
    });

    // ========================================
    // Toggle Active Tests
    // ========================================
    describe('toggleBrokerActive', () => {
        beforeEach(() => {
            mockPrisma.broker.findUnique.mockResolvedValue(mockBrokers[0]);
            mockPrisma.broker.update.mockResolvedValue({
                ...mockBrokers[0],
                isActive: false,
            });
        });

        it('should toggle active status', async () => {
            const result = await toggleBrokerActive('broker-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.broker.update).toHaveBeenCalledWith({
                where: { id: 'broker-1' },
                data: { isActive: false }, // Toggle from true to false
            });
        });

        it('should return error if not found', async () => {
            mockPrisma.broker.findUnique.mockResolvedValueOnce(null);

            const result = await toggleBrokerActive('invalid');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Broker not found');
        });
    });

    // ========================================
    // Toggle Featured Tests
    // ========================================
    describe('toggleBrokerFeatured', () => {
        beforeEach(() => {
            mockPrisma.broker.findUnique.mockResolvedValue(mockBrokers[0]);
            mockPrisma.broker.update.mockResolvedValue({
                ...mockBrokers[0],
                isFeatured: false,
            });
        });

        it('should toggle featured status', async () => {
            const result = await toggleBrokerFeatured('broker-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.broker.update).toHaveBeenCalledWith({
                where: { id: 'broker-1' },
                data: { isFeatured: false }, // Toggle from true to false
            });
        });
    });

    // ========================================
    // Update Rating Tests
    // ========================================
    describe('updateBrokerRating', () => {
        beforeEach(() => {
            mockPrisma.broker.findUnique.mockResolvedValue(mockBrokers[0]);
            mockPrisma.broker.update.mockResolvedValue({
                ...mockBrokers[0],
                rating: 4.8,
            });
        });

        it('should update rating', async () => {
            const result = await updateBrokerRating('broker-1', 4.8);

            expect(result.success).toBe(true);
            expect(mockPrisma.broker.update).toHaveBeenCalledWith({
                where: { id: 'broker-1' },
                data: { rating: 4.8 },
            });
        });

        it('should validate rating range - too high', async () => {
            const result = await updateBrokerRating('broker-1', 6);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Rating must be between 0 and 5');
        });

        it('should validate rating range - negative', async () => {
            const result = await updateBrokerRating('broker-1', -1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Rating must be between 0 and 5');
        });

        it('should return error if not found', async () => {
            mockPrisma.broker.findUnique.mockResolvedValueOnce(null);

            const result = await updateBrokerRating('invalid', 4);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Broker not found');
        });
    });
});
