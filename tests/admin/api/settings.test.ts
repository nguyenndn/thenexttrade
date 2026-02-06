/**
 * Settings API Tests
 * @module tests/admin/api/settings.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSettings, mockAuditLogs } from '../__mocks__/data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// API helper functions
async function getSettings(category?: string) {
    const url = category 
        ? `/api/admin/settings?category=${category}` 
        : '/api/admin/settings';
    const response = await fetch(url);
    return response.json();
}

async function getSetting(key: string) {
    const response = await fetch(`/api/admin/settings/${key}`);
    return response.json();
}

async function updateSetting(key: string, value: string) {
    const response = await fetch(`/api/admin/settings/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
    });
    return response.json();
}

async function createSetting(data: {
    key: string;
    value: string;
    category: string;
    description?: string;
}) {
    const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function deleteSetting(key: string) {
    const response = await fetch(`/api/admin/settings/${key}`, {
        method: 'DELETE',
    });
    return response.json();
}

async function bulkUpdateSettings(settings: { key: string; value: string }[]) {
    const response = await fetch('/api/admin/settings/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
    });
    return response.json();
}

async function getAuditLogs(params: {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
} = {}) {
    const query = new URLSearchParams();
    if (params.userId) query.set('userId', params.userId);
    if (params.action) query.set('action', params.action);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const response = await fetch(`/api/admin/settings/audit?${query.toString()}`);
    return response.json();
}

async function exportSettings(format: 'json' | 'csv') {
    const response = await fetch(`/api/admin/settings/export?format=${format}`);
    return response.json();
}

async function importSettings(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/admin/settings/import', {
        method: 'POST',
        body: formData,
    });
    return response.json();
}

async function resetSettings(category?: string) {
    const response = await fetch('/api/admin/settings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
    });
    return response.json();
}

describe('Settings API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // List Settings Tests
    // ========================================
    describe('GET /api/admin/settings', () => {
        it('should get all settings', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockSettings,
                }),
            });

            const data = await getSettings();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings');
            expect(data.success).toBe(true);
            expect(data.data).toEqual(mockSettings);
        });

        it('should filter by category', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockSettings.filter(s => s.category === 'general'),
                }),
            });

            await getSettings('general');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings?category=general');
        });
    });

    // ========================================
    // Get Single Setting Tests
    // ========================================
    describe('GET /api/admin/settings/:key', () => {
        it('should get setting by key', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockSettings[0],
                }),
            });

            const data = await getSetting('site_name');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/site_name');
            expect(data.success).toBe(true);
        });

        it('should handle not found', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Setting not found',
                }),
            });

            const data = await getSetting('invalid_key');

            expect(data.success).toBe(false);
            expect(data.error).toBe('Setting not found');
        });
    });

    // ========================================
    // Update Setting Tests
    // ========================================
    describe('PUT /api/admin/settings/:key', () => {
        it('should update setting', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockSettings[0], value: 'New Site Name' },
                }),
            });

            const data = await updateSetting('site_name', 'New Site Name');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/site_name', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: 'New Site Name' }),
            });
            expect(data.success).toBe(true);
        });

        it('should create audit log on update', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockSettings[0], value: 'New Value' },
                    auditLogId: 'audit-1',
                }),
            });

            const data = await updateSetting('site_name', 'New Value');

            expect(data.success).toBe(true);
            expect(data.auditLogId).toBeDefined();
        });

        it('should handle validation errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Value is required',
                }),
            });

            const data = await updateSetting('site_name', '');

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Create Setting Tests
    // ========================================
    describe('POST /api/admin/settings', () => {
        const validData = {
            key: 'new_setting',
            value: 'test_value',
            category: 'general',
            description: 'A new setting',
        };

        it('should create setting', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: validData,
                }),
            });

            const data = await createSetting(validData);

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validData),
            });
            expect(data.success).toBe(true);
        });

        it('should handle duplicate key', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Setting key already exists',
                }),
            });

            const data = await createSetting(validData);

            expect(data.success).toBe(false);
        });

        it('should validate key format', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Key must be snake_case',
                }),
            });

            const data = await createSetting({ ...validData, key: 'Invalid Key' });

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Delete Setting Tests
    // ========================================
    describe('DELETE /api/admin/settings/:key', () => {
        it('should delete setting', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Setting deleted',
                }),
            });

            const data = await deleteSetting('custom_setting');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/custom_setting', {
                method: 'DELETE',
            });
            expect(data.success).toBe(true);
        });

        it('should prevent deleting system settings', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Cannot delete system settings',
                }),
            });

            const data = await deleteSetting('site_name');

            expect(data.success).toBe(false);
            expect(data.error).toBe('Cannot delete system settings');
        });
    });

    // ========================================
    // Bulk Update Tests
    // ========================================
    describe('PUT /api/admin/settings/bulk', () => {
        it('should bulk update settings', async () => {
            const settings = [
                { key: 'site_name', value: 'New Name' },
                { key: 'maintenance_mode', value: 'true' },
            ];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    updatedCount: 2,
                }),
            });

            const data = await bulkUpdateSettings(settings);

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/bulk', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            });
            expect(data.success).toBe(true);
            expect(data.updatedCount).toBe(2);
        });

        it('should handle partial failures', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    updatedCount: 1,
                    errors: ['invalid_key: Setting not found'],
                }),
            });

            const data = await bulkUpdateSettings([
                { key: 'site_name', value: 'New Name' },
                { key: 'invalid_key', value: 'test' },
            ]);

            expect(data.updatedCount).toBe(1);
            expect(data.errors).toHaveLength(1);
        });
    });

    // ========================================
    // Audit Logs Tests
    // ========================================
    describe('GET /api/admin/settings/audit', () => {
        it('should get audit logs', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        logs: mockAuditLogs,
                        total: mockAuditLogs.length,
                    },
                }),
            });

            const data = await getAuditLogs();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/audit?');
            expect(data.success).toBe(true);
            expect(data.data.logs).toEqual(mockAuditLogs);
        });

        it('should filter by user', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { logs: mockAuditLogs.filter(l => l.userId === 'user-1') },
                }),
            });

            await getAuditLogs({ userId: 'user-1' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/audit?userId=user-1');
        });

        it('should filter by action', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { logs: mockAuditLogs.filter(l => l.action === 'UPDATE') },
                }),
            });

            await getAuditLogs({ action: 'UPDATE' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/audit?action=UPDATE');
        });

        it('should filter by date range', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { logs: [] },
                }),
            });

            await getAuditLogs({
                startDate: '2025-01-01',
                endDate: '2025-01-31',
            });

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/admin/settings/audit?startDate=2025-01-01&endDate=2025-01-31'
            );
        });

        it('should paginate results', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { logs: mockAuditLogs, total: 100, page: 2 },
                }),
            });

            await getAuditLogs({ page: 2, limit: 50 });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/audit?page=2&limit=50');
        });
    });

    // ========================================
    // Export Settings Tests
    // ========================================
    describe('GET /api/admin/settings/export', () => {
        it('should export as JSON', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    downloadUrl: '/exports/settings.json',
                }),
            });

            const data = await exportSettings('json');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/export?format=json');
            expect(data.success).toBe(true);
        });

        it('should export as CSV', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    downloadUrl: '/exports/settings.csv',
                }),
            });

            const data = await exportSettings('csv');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/export?format=csv');
            expect(data.success).toBe(true);
        });
    });

    // ========================================
    // Import Settings Tests
    // ========================================
    describe('POST /api/admin/settings/import', () => {
        it('should import settings from file', async () => {
            const file = new File(['{}'], 'settings.json', { type: 'application/json' });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    importedCount: 5,
                }),
            });

            const data = await importSettings(file);

            expect(mockFetch).toHaveBeenCalled();
            expect(data.success).toBe(true);
            expect(data.importedCount).toBe(5);
        });

        it('should validate file format', async () => {
            const file = new File([''], 'settings.txt', { type: 'text/plain' });
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Invalid file format. JSON or CSV required.',
                }),
            });

            const data = await importSettings(file);

            expect(data.success).toBe(false);
        });

        it('should handle invalid JSON', async () => {
            const file = new File(['invalid json'], 'settings.json', { type: 'application/json' });
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Invalid JSON format',
                }),
            });

            const data = await importSettings(file);

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Reset Settings Tests
    // ========================================
    describe('POST /api/admin/settings/reset', () => {
        it('should reset all settings', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'All settings reset to defaults',
                }),
            });

            const data = await resetSettings();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: undefined }),
            });
            expect(data.success).toBe(true);
        });

        it('should reset category settings', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Email settings reset to defaults',
                }),
            });

            const data = await resetSettings('email');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: 'email' }),
            });
            expect(data.success).toBe(true);
        });

        it('should require confirmation', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Confirmation required',
                }),
            });

            const data = await resetSettings();

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

            const data = await getSettings();

            expect(data.success).toBe(false);
        });

        it('should handle forbidden', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Admin access required',
                }),
            });

            const data = await updateSetting('site_name', 'Test');

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

            const data = await getSettings();

            expect(data.success).toBe(false);
        });
    });
});
