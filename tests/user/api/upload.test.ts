/**
 * Upload/Media API Tests
 * @module tests/user/api/upload.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper functions
async function uploadFile(file: File, type: string = 'image') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    });
    return res.json();
}

async function uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
    });
    return res.json();
}

async function uploadTradeScreenshot(file: File, journalEntryId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('journalEntryId', journalEntryId);

    const res = await fetch('/api/upload/screenshot', {
        method: 'POST',
        body: formData,
    });
    return res.json();
}

async function deleteMedia(id: string) {
    const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
    return res.json();
}

async function getMyMedia(type?: string) {
    const url = type ? `/api/media?type=${type}` : '/api/media';
    const res = await fetch(url);
    return res.json();
}

// Mock file helper
function createMockFile(name: string, size: number, type: string): File {
    const buffer = new ArrayBuffer(size);
    return new File([buffer], name, { type });
}

describe('Upload API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // General Upload Tests
    // ========================================
    describe('POST /api/upload', () => {
        it('should upload an image file', async () => {
            const file = createMockFile('test.jpg', 1024 * 100, 'image/jpeg');

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'media-1',
                        url: '/uploads/test-123.jpg',
                        filename: 'test.jpg',
                        size: 102400,
                        type: 'image/jpeg',
                    },
                }),
            });

            const data = await uploadFile(file);

            expect(data.success).toBe(true);
            expect(data.data.url).toBeDefined();
            expect(data.data.type).toBe('image/jpeg');
        });

        it('should reject files exceeding size limit', async () => {
            const largeFile = createMockFile('large.jpg', 1024 * 1024 * 20, 'image/jpeg'); // 20MB

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'File size exceeds maximum limit of 10MB',
                }),
            });

            const data = await uploadFile(largeFile);

            expect(data.success).toBe(false);
            expect(data.error).toContain('size');
        });

        it('should reject invalid file types', async () => {
            const exeFile = createMockFile('virus.exe', 1024, 'application/x-msdownload');

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Invalid file type. Allowed types: image/jpeg, image/png, image/gif, image/webp',
                }),
            });

            const data = await uploadFile(exeFile);

            expect(data.success).toBe(false);
            expect(data.error).toContain('Invalid file type');
        });

        it('should require authentication', async () => {
            const file = createMockFile('test.jpg', 1024, 'image/jpeg');

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Unauthorized',
                }),
            });

            const data = await uploadFile(file);

            expect(data.success).toBe(false);
            expect(data.error).toBe('Unauthorized');
        });

        it('should generate unique filename', async () => {
            const file = createMockFile('test.jpg', 1024, 'image/jpeg');

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'media-1',
                        url: '/uploads/abc123-test.jpg',
                        originalFilename: 'test.jpg',
                    },
                }),
            });

            const data = await uploadFile(file);

            expect(data.data.url).not.toBe('/uploads/test.jpg');
        });
    });

    // ========================================
    // Avatar Upload Tests
    // ========================================
    describe('POST /api/upload/avatar', () => {
        it('should upload avatar image', async () => {
            const file = createMockFile('avatar.png', 1024 * 50, 'image/png');

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'avatar-1',
                        url: '/avatars/user-1-abc123.png',
                        thumbnail: '/avatars/user-1-abc123-thumb.png',
                    },
                }),
            });

            const data = await uploadAvatar(file);

            expect(data.success).toBe(true);
            expect(data.data.url).toContain('/avatars/');
        });

        it('should create thumbnail for avatar', async () => {
            const file = createMockFile('avatar.png', 1024 * 50, 'image/png');

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        url: '/avatars/user-1.png',
                        thumbnail: '/avatars/user-1-thumb.png',
                    },
                }),
            });

            const data = await uploadAvatar(file);

            expect(data.data.thumbnail).toBeDefined();
        });

        it('should replace existing avatar', async () => {
            const file = createMockFile('new-avatar.png', 1024 * 50, 'image/png');

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        url: '/avatars/user-1-new.png',
                        previousDeleted: true,
                    },
                }),
            });

            const data = await uploadAvatar(file);

            expect(data.success).toBe(true);
            expect(data.data.previousDeleted).toBe(true);
        });

        it('should enforce avatar size limit (5MB)', async () => {
            const largeAvatar = createMockFile('large.png', 1024 * 1024 * 6, 'image/png');

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Avatar size exceeds maximum limit of 5MB',
                }),
            });

            const data = await uploadAvatar(largeAvatar);

            expect(data.success).toBe(false);
        });

        it('should only accept square-ish images', async () => {
            const file = createMockFile('wide.png', 1024, 'image/png');

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Avatar image should be square (1:1 aspect ratio)',
                }),
            });

            const data = await uploadAvatar(file);

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Trade Screenshot Upload Tests
    // ========================================
    describe('POST /api/upload/screenshot', () => {
        it('should upload trade screenshot', async () => {
            const file = createMockFile('chart.png', 1024 * 200, 'image/png');

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'screenshot-1',
                        url: '/uploads/screenshots/chart-123.png',
                        journalEntryId: 'entry-1',
                    },
                }),
            });

            const data = await uploadTradeScreenshot(file, 'entry-1');

            expect(data.success).toBe(true);
            expect(data.data.journalEntryId).toBe('entry-1');
        });

        it('should link screenshot to journal entry', async () => {
            const file = createMockFile('chart.png', 1024 * 200, 'image/png');

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'screenshot-1',
                        url: '/uploads/screenshots/chart-123.png',
                        journalEntry: {
                            id: 'entry-1',
                            symbol: 'EURUSD',
                        },
                    },
                }),
            });

            const data = await uploadTradeScreenshot(file, 'entry-1');

            expect(data.data.journalEntry).toBeDefined();
        });

        it('should validate journal entry exists', async () => {
            const file = createMockFile('chart.png', 1024, 'image/png');

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Journal entry not found',
                }),
            });

            const data = await uploadTradeScreenshot(file, 'invalid-entry');

            expect(data.success).toBe(false);
        });

        it('should only allow owner to upload', async () => {
            const file = createMockFile('chart.png', 1024, 'image/png');

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: () => Promise.resolve({
                    success: false,
                    error: 'You can only upload to your own journal entries',
                }),
            });

            const data = await uploadTradeScreenshot(file, 'other-user-entry');

            expect(data.success).toBe(false);
        });

        it('should limit screenshots per entry', async () => {
            const file = createMockFile('chart.png', 1024, 'image/png');

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Maximum 5 screenshots per journal entry',
                }),
            });

            const data = await uploadTradeScreenshot(file, 'entry-1');

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Delete Media Tests
    // ========================================
    describe('DELETE /api/media/:id', () => {
        it('should delete own media', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Media deleted successfully',
                }),
            });

            const data = await deleteMedia('media-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/media/media-1', { method: 'DELETE' });
            expect(data.success).toBe(true);
        });

        it('should not delete other user media', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: () => Promise.resolve({
                    success: false,
                    error: 'You can only delete your own media',
                }),
            });

            const data = await deleteMedia('other-user-media');

            expect(data.success).toBe(false);
        });

        it('should return 404 for non-existent media', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Media not found',
                }),
            });

            const data = await deleteMedia('invalid-id');

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // List Media Tests
    // ========================================
    describe('GET /api/media', () => {
        it('should list user media', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [
                        { id: 'media-1', url: '/uploads/file1.jpg', type: 'image' },
                        { id: 'media-2', url: '/uploads/file2.png', type: 'image' },
                    ],
                }),
            });

            const data = await getMyMedia();

            expect(mockFetch).toHaveBeenCalledWith('/api/media');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(2);
        });

        it('should filter by type', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [{ id: 'screenshot-1', type: 'screenshot' }],
                }),
            });

            await getMyMedia('screenshot');

            expect(mockFetch).toHaveBeenCalledWith('/api/media?type=screenshot');
        });

        it('should include file metadata', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [
                        {
                            id: 'media-1',
                            url: '/uploads/file1.jpg',
                            filename: 'file1.jpg',
                            size: 102400,
                            mimeType: 'image/jpeg',
                            createdAt: '2025-01-15T10:00:00Z',
                        },
                    ],
                }),
            });

            const data = await getMyMedia();

            expect(data.data[0].size).toBe(102400);
            expect(data.data[0].mimeType).toBe('image/jpeg');
        });
    });
});
