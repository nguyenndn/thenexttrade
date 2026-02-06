/**
 * Settings Actions Tests
 * @module tests/admin/actions/settings-actions.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSettings, mockAuditLogs } from '../__mocks__/data';

// Mock Prisma
const mockPrisma = {
    setting: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
    },
    auditLog: {
        findMany: vi.fn(),
        create: vi.fn(),
        count: vi.fn(),
    },
    user: {
        findUnique: vi.fn(),
    },
};

vi.mock('@/lib/prisma', () => ({
    default: mockPrisma,
}));

// Simulated settings actions
async function getSettings(category?: string) {
    const where = category ? { category } : {};
    const settings = await mockPrisma.setting.findMany({ where });

    return { success: true, data: settings };
}

async function getSetting(key: string) {
    const setting = await mockPrisma.setting.findFirst({
        where: { key },
    });

    if (!setting) {
        return { success: false, error: 'Setting not found' };
    }

    return { success: true, data: setting };
}

async function updateSetting(key: string, value: string, userId: string) {
    if (!key || value === undefined) {
        return { success: false, error: 'Key and value are required' };
    }

    // Get old value for audit log
    const oldSetting = await mockPrisma.setting.findFirst({ where: { key } });

    const setting = await mockPrisma.setting.upsert({
        where: { key },
        update: { value, updatedAt: new Date() },
        create: { key, value, createdAt: new Date(), updatedAt: new Date() },
    });

    // Create audit log
    await mockPrisma.auditLog.create({
        data: {
            userId,
            action: 'UPDATE_SETTING',
            entity: 'SETTING',
            entityId: key,
            oldValue: oldSetting?.value,
            newValue: value,
            createdAt: new Date(),
        },
    });

    return { success: true, data: setting };
}

async function updateBulkSettings(
    settings: Array<{ key: string; value: string }>,
    userId: string
) {
    if (!settings || settings.length === 0) {
        return { success: false, error: 'Settings array is required' };
    }

    const results = [];

    for (const { key, value } of settings) {
        const result = await updateSetting(key, value, userId);
        results.push({ key, success: result.success });
    }

    return {
        success: true,
        data: results,
        updatedCount: results.filter((r) => r.success).length,
    };
}

async function deleteSetting(key: string, userId: string) {
    const setting = await mockPrisma.setting.findFirst({ where: { key } });

    if (!setting) {
        return { success: false, error: 'Setting not found' };
    }

    await mockPrisma.setting.delete({ where: { key } });

    // Create audit log
    await mockPrisma.auditLog.create({
        data: {
            userId,
            action: 'DELETE_SETTING',
            entity: 'SETTING',
            entityId: key,
            oldValue: setting.value,
            createdAt: new Date(),
        },
    });

    return { success: true };
}

async function getAuditLogs(options: {
    action?: string;
    entity?: string;
    userId?: string;
    limit?: number;
    offset?: number;
}) {
    const where: Record<string, unknown> = {};
    if (options.action) where.action = options.action;
    if (options.entity) where.entity = options.entity;
    if (options.userId) where.userId = options.userId;

    const logs = await mockPrisma.auditLog.findMany({
        where,
        take: options.limit || 50,
        skip: options.offset || 0,
        orderBy: { createdAt: 'desc' },
        include: { user: true },
    });

    const total = await mockPrisma.auditLog.count({ where });

    return { success: true, data: { logs, total } };
}

describe('Settings Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma.setting.findMany.mockResolvedValue(mockSettings);
    });

    // ========================================
    // Get Settings Tests
    // ========================================
    describe('getSettings', () => {
        it('should get all settings', async () => {
            const result = await getSettings();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockSettings);
            expect(mockPrisma.setting.findMany).toHaveBeenCalledWith({ where: {} });
        });

        it('should filter by category', async () => {
            await getSettings('general');

            expect(mockPrisma.setting.findMany).toHaveBeenCalledWith({
                where: { category: 'general' },
            });
        });

        it('should return empty array if no settings', async () => {
            mockPrisma.setting.findMany.mockResolvedValueOnce([]);

            const result = await getSettings();

            expect(result.data).toEqual([]);
        });
    });

    // ========================================
    // Get Single Setting Tests
    // ========================================
    describe('getSetting', () => {
        it('should get setting by key', async () => {
            mockPrisma.setting.findFirst.mockResolvedValueOnce(mockSettings[0]);

            const result = await getSetting('site_name');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockSettings[0]);
        });

        it('should return error if not found', async () => {
            mockPrisma.setting.findFirst.mockResolvedValueOnce(null);

            const result = await getSetting('nonexistent');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Setting not found');
        });
    });

    // ========================================
    // Update Setting Tests
    // ========================================
    describe('updateSetting', () => {
        beforeEach(() => {
            mockPrisma.setting.findFirst.mockResolvedValue(mockSettings[0]);
            mockPrisma.setting.upsert.mockResolvedValue({
                key: 'site_name',
                value: 'New Site Name',
                updatedAt: new Date(),
            });
            mockPrisma.auditLog.create.mockResolvedValue({
                id: 'log-1',
                action: 'UPDATE_SETTING',
            });
        });

        it('should update existing setting', async () => {
            const result = await updateSetting('site_name', 'New Site Name', 'admin-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.setting.upsert).toHaveBeenCalled();
        });

        it('should create audit log', async () => {
            await updateSetting('site_name', 'New Site Name', 'admin-1');

            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 'admin-1',
                    action: 'UPDATE_SETTING',
                    entity: 'SETTING',
                    entityId: 'site_name',
                }),
            });
        });

        it('should include old value in audit log', async () => {
            await updateSetting('site_name', 'New Site Name', 'admin-1');

            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    oldValue: mockSettings[0].value,
                    newValue: 'New Site Name',
                }),
            });
        });

        it('should require key', async () => {
            const result = await updateSetting('', 'value', 'admin-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Key and value are required');
        });

        it('should create new setting if not exists', async () => {
            mockPrisma.setting.findFirst.mockResolvedValueOnce(null);
            mockPrisma.setting.upsert.mockResolvedValueOnce({
                key: 'new_setting',
                value: 'new value',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const result = await updateSetting('new_setting', 'new value', 'admin-1');

            expect(result.success).toBe(true);
        });
    });

    // ========================================
    // Bulk Update Tests
    // ========================================
    describe('updateBulkSettings', () => {
        beforeEach(() => {
            mockPrisma.setting.findFirst.mockResolvedValue(mockSettings[0]);
            mockPrisma.setting.upsert.mockResolvedValue({
                key: 'test',
                value: 'value',
            });
            mockPrisma.auditLog.create.mockResolvedValue({});
        });

        it('should update multiple settings', async () => {
            const settings = [
                { key: 'site_name', value: 'New Name' },
                { key: 'site_description', value: 'New Description' },
            ];

            const result = await updateBulkSettings(settings, 'admin-1');

            expect(result.success).toBe(true);
            expect(result.updatedCount).toBe(2);
        });

        it('should return results for each setting', async () => {
            const settings = [
                { key: 'setting1', value: 'value1' },
                { key: 'setting2', value: 'value2' },
            ];

            const result = await updateBulkSettings(settings, 'admin-1');

            expect(result.data).toHaveLength(2);
            expect(result.data).toEqual([
                { key: 'setting1', success: true },
                { key: 'setting2', success: true },
            ]);
        });

        it('should require non-empty array', async () => {
            const result = await updateBulkSettings([], 'admin-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Settings array is required');
        });
    });

    // ========================================
    // Delete Setting Tests
    // ========================================
    describe('deleteSetting', () => {
        beforeEach(() => {
            mockPrisma.setting.findFirst.mockResolvedValue(mockSettings[0]);
            mockPrisma.setting.delete.mockResolvedValue(mockSettings[0]);
            mockPrisma.auditLog.create.mockResolvedValue({});
        });

        it('should delete setting', async () => {
            const result = await deleteSetting('site_name', 'admin-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.setting.delete).toHaveBeenCalledWith({
                where: { key: 'site_name' },
            });
        });

        it('should create audit log on delete', async () => {
            await deleteSetting('site_name', 'admin-1');

            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    action: 'DELETE_SETTING',
                    oldValue: mockSettings[0].value,
                }),
            });
        });

        it('should return error if not found', async () => {
            mockPrisma.setting.findFirst.mockResolvedValueOnce(null);

            const result = await deleteSetting('nonexistent', 'admin-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Setting not found');
        });
    });
});

describe('Audit Log Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma.auditLog.findMany.mockResolvedValue(mockAuditLogs);
        mockPrisma.auditLog.count.mockResolvedValue(mockAuditLogs.length);
    });

    // ========================================
    // Get Audit Logs Tests
    // ========================================
    describe('getAuditLogs', () => {
        it('should get all audit logs', async () => {
            const result = await getAuditLogs({});

            expect(result.success).toBe(true);
            expect(result.data.logs).toEqual(mockAuditLogs);
            expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
                where: {},
                take: 50,
                skip: 0,
                orderBy: { createdAt: 'desc' },
                include: { user: true },
            });
        });

        it('should filter by action', async () => {
            await getAuditLogs({ action: 'UPDATE_SETTING' });

            expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { action: 'UPDATE_SETTING' },
                })
            );
        });

        it('should filter by entity', async () => {
            await getAuditLogs({ entity: 'SETTING' });

            expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { entity: 'SETTING' },
                })
            );
        });

        it('should filter by userId', async () => {
            await getAuditLogs({ userId: 'admin-1' });

            expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId: 'admin-1' },
                })
            );
        });

        it('should apply pagination', async () => {
            await getAuditLogs({ limit: 20, offset: 40 });

            expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 20,
                    skip: 40,
                })
            );
        });

        it('should return total count', async () => {
            mockPrisma.auditLog.count.mockResolvedValueOnce(500);

            const result = await getAuditLogs({});

            expect(result.data.total).toBe(500);
        });

        it('should combine multiple filters', async () => {
            await getAuditLogs({
                action: 'UPDATE_SETTING',
                entity: 'SETTING',
                userId: 'admin-1',
            });

            expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        action: 'UPDATE_SETTING',
                        entity: 'SETTING',
                        userId: 'admin-1',
                    },
                })
            );
        });
    });
});
