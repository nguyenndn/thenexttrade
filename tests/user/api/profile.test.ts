/**
 * Profile & Settings API Tests
 * @module tests/user/api/profile.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockUser } from '../__mocks__/data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// API helper functions
async function getProfile() {
    const response = await fetch('/api/profile');
    return response.json();
}

async function updateProfile(data: {
    name?: string;
    bio?: string;
    phone?: string;
    website?: string;
    location?: string;
    tradingStyle?: string;
    experience?: string;
    socialLinks?: {
        twitter?: string;
        linkedin?: string;
        telegram?: string;
    };
}) {
    const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
    });
    return response.json();
}

async function deleteAvatar() {
    const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
    });
    return response.json();
}

async function getSettings() {
    const response = await fetch('/api/user/settings');
    return response.json();
}

async function updateSettings(data: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
    currency?: string;
    dateFormat?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    marketingEmails?: boolean;
    twoFactorEnabled?: boolean;
}) {
    const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}) {
    const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function enable2FA() {
    const response = await fetch('/api/user/2fa/enable', {
        method: 'POST',
    });
    return response.json();
}

async function verify2FA(code: string) {
    const response = await fetch('/api/user/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
    });
    return response.json();
}

async function disable2FA(code: string) {
    const response = await fetch('/api/user/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
    });
    return response.json();
}

async function getActiveSessions() {
    const response = await fetch('/api/user/sessions');
    return response.json();
}

async function revokeSession(sessionId: string) {
    const response = await fetch(`/api/user/sessions/${sessionId}`, {
        method: 'DELETE',
    });
    return response.json();
}

async function revokeAllSessions() {
    const response = await fetch('/api/user/sessions/revoke-all', {
        method: 'POST',
    });
    return response.json();
}

async function exportData() {
    const response = await fetch('/api/user/export');
    return response.json();
}

async function deleteAccount(password: string) {
    const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
    });
    return response.json();
}

describe('Profile API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Get Profile Tests
    // ========================================
    describe('GET /api/profile', () => {
        it('should get user profile', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockUser,
                }),
            });

            const data = await getProfile();

            expect(mockFetch).toHaveBeenCalledWith('/api/profile');
            expect(data.success).toBe(true);
            expect(data.data.email).toBe('user@example.com');
        });
    });

    // ========================================
    // Update Profile Tests
    // ========================================
    describe('PATCH /api/profile', () => {
        it('should update profile name', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockUser, name: 'John Updated' },
                }),
            });

            const data = await updateProfile({ name: 'John Updated' });

            expect(mockFetch).toHaveBeenCalledWith('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'John Updated' }),
            });
            expect(data.data.name).toBe('John Updated');
        });

        it('should update trading style', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockUser, tradingStyle: 'SWING' },
                }),
            });

            const data = await updateProfile({ tradingStyle: 'SWING' });

            expect(data.data.tradingStyle).toBe('SWING');
        });

        it('should update social links', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        ...mockUser,
                        socialLinks: {
                            twitter: 'https://twitter.com/johntrader',
                            linkedin: 'https://linkedin.com/in/johntrader',
                        },
                    },
                }),
            });

            const data = await updateProfile({
                socialLinks: {
                    twitter: 'https://twitter.com/johntrader',
                    linkedin: 'https://linkedin.com/in/johntrader',
                },
            });

            expect(data.data.socialLinks.twitter).toBe('https://twitter.com/johntrader');
        });

        it('should validate name length', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Name must be at least 2 characters',
                }),
            });

            const data = await updateProfile({ name: 'J' });

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Avatar Tests
    // ========================================
    describe('POST /api/profile/avatar', () => {
        it('should upload avatar', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        avatarUrl: 'https://storage.example.com/avatars/user-1.jpg',
                    },
                }),
            });

            const file = new File([''], 'avatar.jpg', { type: 'image/jpeg' });
            const data = await uploadAvatar(file);

            expect(data.success).toBe(true);
            expect(data.data.avatarUrl).toBeDefined();
        });

        it('should validate file type', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Invalid file type. Only JPEG, PNG, and GIF are allowed.',
                }),
            });

            const file = new File([''], 'avatar.pdf', { type: 'application/pdf' });
            const data = await uploadAvatar(file);

            expect(data.success).toBe(false);
        });

        it('should validate file size', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'File size must be less than 5MB',
                }),
            });

            const file = new File([''], 'large.jpg', { type: 'image/jpeg' });
            const data = await uploadAvatar(file);

            expect(data.success).toBe(false);
        });
    });

    describe('DELETE /api/profile/avatar', () => {
        it('should delete avatar', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Avatar deleted successfully',
                }),
            });

            const data = await deleteAvatar();

            expect(mockFetch).toHaveBeenCalledWith('/api/profile/avatar', {
                method: 'DELETE',
            });
            expect(data.success).toBe(true);
        });
    });
});

describe('Settings API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Get Settings Tests
    // ========================================
    describe('GET /api/user/settings', () => {
        it('should get user settings', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockUser.settings,
                }),
            });

            const data = await getSettings();

            expect(mockFetch).toHaveBeenCalledWith('/api/user/settings');
            expect(data.success).toBe(true);
            expect(data.data.notifications.email).toBe(true);
        });
    });

    // ========================================
    // Update Settings Tests
    // ========================================
    describe('PATCH /api/user/settings', () => {
        it('should update theme', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockUser.settings, theme: 'light' },
                }),
            });

            const data = await updateSettings({ theme: 'light' });

            expect(data.data.theme).toBe('light');
        });

        it('should update language', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockUser.settings, language: 'vi' },
                }),
            });

            const data = await updateSettings({ language: 'vi' });

            expect(data.data.language).toBe('vi');
        });

        it('should update notification preferences', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        ...mockUser.settings,
                        emailNotifications: false,
                        pushNotifications: true,
                    },
                }),
            });

            const data = await updateSettings({
                emailNotifications: false,
                pushNotifications: true,
            });

            expect(data.data.emailNotifications).toBe(false);
            expect(data.data.pushNotifications).toBe(true);
        });
    });

    // ========================================
    // Password Tests
    // ========================================
    describe('POST /api/user/password', () => {
        it('should change password successfully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Password changed successfully',
                }),
            });

            const data = await changePassword({
                currentPassword: 'OldPass123!',
                newPassword: 'NewPass456!',
                confirmPassword: 'NewPass456!',
            });

            expect(data.success).toBe(true);
        });

        it('should validate current password', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Current password is incorrect',
                }),
            });

            const data = await changePassword({
                currentPassword: 'WrongPass',
                newPassword: 'NewPass456!',
                confirmPassword: 'NewPass456!',
            });

            expect(data.success).toBe(false);
        });

        it('should validate password strength', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character',
                }),
            });

            const data = await changePassword({
                currentPassword: 'OldPass123!',
                newPassword: 'weak',
                confirmPassword: 'weak',
            });

            expect(data.success).toBe(false);
        });

        it('should validate password confirmation', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Passwords do not match',
                }),
            });

            const data = await changePassword({
                currentPassword: 'OldPass123!',
                newPassword: 'NewPass456!',
                confirmPassword: 'DifferentPass!',
            });

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // 2FA Tests
    // ========================================
    describe('POST /api/user/2fa/enable', () => {
        it('should initiate 2FA setup', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        qrCode: 'data:image/png;base64,QRCODE...',
                        secret: 'ABCD1234EFGH5678',
                        backupCodes: [
                            'ABC123',
                            'DEF456',
                            'GHI789',
                        ],
                    },
                }),
            });

            const data = await enable2FA();

            expect(data.success).toBe(true);
            expect(data.data.qrCode).toBeDefined();
            expect(data.data.backupCodes).toHaveLength(3);
        });
    });

    describe('POST /api/user/2fa/verify', () => {
        it('should verify and enable 2FA', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: '2FA enabled successfully',
                }),
            });

            const data = await verify2FA('123456');

            expect(data.success).toBe(true);
        });

        it('should reject invalid code', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Invalid verification code',
                }),
            });

            const data = await verify2FA('000000');

            expect(data.success).toBe(false);
        });
    });

    describe('POST /api/user/2fa/disable', () => {
        it('should disable 2FA', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: '2FA disabled successfully',
                }),
            });

            const data = await disable2FA('123456');

            expect(data.success).toBe(true);
        });
    });

    // ========================================
    // Sessions Tests
    // ========================================
    describe('GET /api/user/sessions', () => {
        it('should get active sessions', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [
                        {
                            id: 'session-1',
                            device: 'Chrome on Windows',
                            ip: '192.168.1.1',
                            location: 'Ho Chi Minh City, Vietnam',
                            lastActive: '2025-01-15T10:00:00Z',
                            isCurrent: true,
                        },
                        {
                            id: 'session-2',
                            device: 'Safari on iPhone',
                            ip: '192.168.1.2',
                            location: 'Ho Chi Minh City, Vietnam',
                            lastActive: '2025-01-14T20:00:00Z',
                            isCurrent: false,
                        },
                    ],
                }),
            });

            const data = await getActiveSessions();

            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(2);
        });
    });

    describe('DELETE /api/user/sessions/:id', () => {
        it('should revoke a session', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Session revoked successfully',
                }),
            });

            const data = await revokeSession('session-2');

            expect(mockFetch).toHaveBeenCalledWith('/api/user/sessions/session-2', {
                method: 'DELETE',
            });
            expect(data.success).toBe(true);
        });

        it('should not revoke current session', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Cannot revoke current session',
                }),
            });

            const data = await revokeSession('session-1');

            expect(data.success).toBe(false);
        });
    });

    describe('POST /api/user/sessions/revoke-all', () => {
        it('should revoke all other sessions', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'All other sessions revoked',
                    revokedCount: 3,
                }),
            });

            const data = await revokeAllSessions();

            expect(data.success).toBe(true);
            expect(data.revokedCount).toBe(3);
        });
    });

    // ========================================
    // Data Export Tests
    // ========================================
    describe('GET /api/user/export', () => {
        it('should export user data', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        downloadUrl: 'https://storage.example.com/exports/user-1-data.zip',
                        expiresAt: '2025-01-16T10:00:00Z',
                    },
                }),
            });

            const data = await exportData();

            expect(data.success).toBe(true);
            expect(data.data.downloadUrl).toBeDefined();
        });
    });

    // ========================================
    // Delete Account Tests
    // ========================================
    describe('DELETE /api/user/delete', () => {
        it('should delete account', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Account scheduled for deletion',
                }),
            });

            const data = await deleteAccount('MyPassword123!');

            expect(data.success).toBe(true);
        });

        it('should require correct password', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Invalid password',
                }),
            });

            const data = await deleteAccount('WrongPassword');

            expect(data.success).toBe(false);
        });
    });
});
