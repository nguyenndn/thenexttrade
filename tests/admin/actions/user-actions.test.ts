/**
 * User Role Management Actions Tests
 * @module tests/admin/actions/user-actions.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockUsers, mockUserStats } from '../__mocks__/data';

// Mock Prisma
const mockPrisma = {
    user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    auditLog: {
        create: vi.fn(),
    },
};

vi.mock('@/lib/prisma', () => ({
    default: mockPrisma,
}));

// Simulated user actions
async function getUsers(options: {
    role?: string;
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'name' | 'lastLogin';
    order?: 'asc' | 'desc';
}) {
    const where: Record<string, unknown> = {};
    
    if (options.role && options.role !== 'ALL') {
        where.role = options.role;
    }
    
    if (options.search) {
        where.OR = [
            { name: { contains: options.search, mode: 'insensitive' } },
            { email: { contains: options.search, mode: 'insensitive' } },
        ];
    }

    const users = await mockPrisma.user.findMany({
        where,
        take: options.limit || 20,
        skip: options.offset || 0,
        orderBy: { [options.orderBy || 'createdAt']: options.order || 'desc' },
    });

    const total = await mockPrisma.user.count({ where });

    return { success: true, data: { users, total } };
}

async function getUserById(id: string) {
    const user = await mockPrisma.user.findUnique({
        where: { id },
        include: {
            articles: { take: 5 },
            comments: { take: 5 },
            licenseAccounts: true,
        },
    });

    if (!user) {
        return { success: false, error: 'User not found' };
    }

    return { success: true, data: user };
}

async function updateUserRole(
    userId: string,
    newRole: string,
    adminId: string
) {
    const validRoles = ['ADMIN', 'EDITOR', 'USER'];
    
    if (!validRoles.includes(newRole)) {
        return { success: false, error: 'Invalid role' };
    }

    const user = await mockPrisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
        return { success: false, error: 'User not found' };
    }

    const oldRole = user.role;

    const updatedUser = await mockPrisma.user.update({
        where: { id: userId },
        data: { role: newRole },
    });

    // Create audit log
    await mockPrisma.auditLog.create({
        data: {
            userId: adminId,
            action: 'UPDATE_USER_ROLE',
            entity: 'USER',
            entityId: userId,
            oldValue: oldRole,
            newValue: newRole,
            createdAt: new Date(),
        },
    });

    return { success: true, data: updatedUser };
}

async function banUser(userId: string, reason: string, adminId: string) {
    if (!reason) {
        return { success: false, error: 'Ban reason is required' };
    }

    const user = await mockPrisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
        return { success: false, error: 'User not found' };
    }

    if (user.role === 'ADMIN') {
        return { success: false, error: 'Cannot ban admin users' };
    }

    const updatedUser = await mockPrisma.user.update({
        where: { id: userId },
        data: {
            isBanned: true,
            banReason: reason,
            bannedAt: new Date(),
            bannedBy: adminId,
        },
    });

    await mockPrisma.auditLog.create({
        data: {
            userId: adminId,
            action: 'BAN_USER',
            entity: 'USER',
            entityId: userId,
            details: { reason },
            createdAt: new Date(),
        },
    });

    return { success: true, data: updatedUser };
}

async function unbanUser(userId: string, adminId: string) {
    const user = await mockPrisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
        return { success: false, error: 'User not found' };
    }

    if (!user.isBanned) {
        return { success: false, error: 'User is not banned' };
    }

    const updatedUser = await mockPrisma.user.update({
        where: { id: userId },
        data: {
            isBanned: false,
            banReason: null,
            bannedAt: null,
            bannedBy: null,
        },
    });

    await mockPrisma.auditLog.create({
        data: {
            userId: adminId,
            action: 'UNBAN_USER',
            entity: 'USER',
            entityId: userId,
            createdAt: new Date(),
        },
    });

    return { success: true, data: updatedUser };
}

async function deleteUser(userId: string, adminId: string) {
    const user = await mockPrisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
        return { success: false, error: 'User not found' };
    }

    if (user.role === 'ADMIN') {
        return { success: false, error: 'Cannot delete admin users' };
    }

    await mockPrisma.user.delete({ where: { id: userId } });

    await mockPrisma.auditLog.create({
        data: {
            userId: adminId,
            action: 'DELETE_USER',
            entity: 'USER',
            entityId: userId,
            details: { email: user.email },
            createdAt: new Date(),
        },
    });

    return { success: true };
}

async function getUserStats() {
    const total = await mockPrisma.user.count();
    const admins = await mockPrisma.user.count({ where: { role: 'ADMIN' } });
    const editors = await mockPrisma.user.count({ where: { role: 'EDITOR' } });
    const users = await mockPrisma.user.count({ where: { role: 'USER' } });

    return {
        success: true,
        data: {
            total,
            byRole: { ADMIN: admins, EDITOR: editors, USER: users },
        },
    };
}

describe('User Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma.user.findMany.mockResolvedValue(mockUsers);
        mockPrisma.user.count.mockResolvedValue(mockUsers.length);
    });

    // ========================================
    // Get Users Tests
    // ========================================
    describe('getUsers', () => {
        it('should get all users with default options', async () => {
            const result = await getUsers({});

            expect(result.success).toBe(true);
            expect(result.data.users).toEqual(mockUsers);
            expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
                where: {},
                take: 20,
                skip: 0,
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should filter by role', async () => {
            await getUsers({ role: 'ADMIN' });

            expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { role: 'ADMIN' },
                })
            );
        });

        it('should not filter when role is ALL', async () => {
            await getUsers({ role: 'ALL' });

            expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {},
                })
            );
        });

        it('should search by name or email', async () => {
            await getUsers({ search: 'john' });

            expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        OR: [
                            { name: { contains: 'john', mode: 'insensitive' } },
                            { email: { contains: 'john', mode: 'insensitive' } },
                        ],
                    },
                })
            );
        });

        it('should apply pagination', async () => {
            await getUsers({ limit: 10, offset: 20 });

            expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 10,
                    skip: 20,
                })
            );
        });

        it('should order by specified field', async () => {
            await getUsers({ orderBy: 'name', order: 'asc' });

            expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { name: 'asc' },
                })
            );
        });
    });

    // ========================================
    // Get User By ID Tests
    // ========================================
    describe('getUserById', () => {
        it('should get user with relations', async () => {
            mockPrisma.user.findUnique.mockResolvedValueOnce({
                ...mockUsers[0],
                articles: [],
                comments: [],
                licenseAccounts: [],
            });

            const result = await getUserById('user-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                include: {
                    articles: { take: 5 },
                    comments: { take: 5 },
                    licenseAccounts: true,
                },
            });
        });

        it('should return error if not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValueOnce(null);

            const result = await getUserById('invalid');

            expect(result.success).toBe(false);
            expect(result.error).toBe('User not found');
        });
    });

    // ========================================
    // Update User Role Tests
    // ========================================
    describe('updateUserRole', () => {
        beforeEach(() => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUsers[1]); // USER role
            mockPrisma.user.update.mockResolvedValue({
                ...mockUsers[1],
                role: 'EDITOR',
            });
            mockPrisma.auditLog.create.mockResolvedValue({});
        });

        it('should update user role', async () => {
            const result = await updateUserRole('user-2', 'EDITOR', 'admin-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-2' },
                data: { role: 'EDITOR' },
            });
        });

        it('should create audit log', async () => {
            await updateUserRole('user-2', 'EDITOR', 'admin-1');

            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 'admin-1',
                    action: 'UPDATE_USER_ROLE',
                    oldValue: 'USER',
                    newValue: 'EDITOR',
                }),
            });
        });

        it('should reject invalid role', async () => {
            const result = await updateUserRole('user-2', 'SUPERADMIN', 'admin-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid role');
        });

        it('should return error if user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValueOnce(null);

            const result = await updateUserRole('invalid', 'EDITOR', 'admin-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('User not found');
        });
    });

    // ========================================
    // Ban User Tests
    // ========================================
    describe('banUser', () => {
        beforeEach(() => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUsers[1]); // USER role
            mockPrisma.user.update.mockResolvedValue({
                ...mockUsers[1],
                isBanned: true,
            });
            mockPrisma.auditLog.create.mockResolvedValue({});
        });

        it('should ban user with reason', async () => {
            const result = await banUser('user-2', 'Spam', 'admin-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-2' },
                data: expect.objectContaining({
                    isBanned: true,
                    banReason: 'Spam',
                }),
            });
        });

        it('should require reason', async () => {
            const result = await banUser('user-2', '', 'admin-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Ban reason is required');
        });

        it('should not ban admin users', async () => {
            mockPrisma.user.findUnique.mockResolvedValueOnce(mockUsers[0]); // ADMIN

            const result = await banUser('user-1', 'Test', 'admin-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Cannot ban admin users');
        });

        it('should create audit log', async () => {
            await banUser('user-2', 'Spam', 'admin-1');

            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    action: 'BAN_USER',
                    details: { reason: 'Spam' },
                }),
            });
        });
    });

    // ========================================
    // Unban User Tests
    // ========================================
    describe('unbanUser', () => {
        beforeEach(() => {
            mockPrisma.user.findUnique.mockResolvedValue({
                ...mockUsers[1],
                isBanned: true,
            });
            mockPrisma.user.update.mockResolvedValue({
                ...mockUsers[1],
                isBanned: false,
            });
            mockPrisma.auditLog.create.mockResolvedValue({});
        });

        it('should unban user', async () => {
            const result = await unbanUser('user-2', 'admin-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-2' },
                data: expect.objectContaining({
                    isBanned: false,
                    banReason: null,
                }),
            });
        });

        it('should error if user not banned', async () => {
            mockPrisma.user.findUnique.mockResolvedValueOnce({
                ...mockUsers[1],
                isBanned: false,
            });

            const result = await unbanUser('user-2', 'admin-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('User is not banned');
        });
    });

    // ========================================
    // Delete User Tests
    // ========================================
    describe('deleteUser', () => {
        beforeEach(() => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUsers[1]); // USER
            mockPrisma.user.delete.mockResolvedValue(mockUsers[1]);
            mockPrisma.auditLog.create.mockResolvedValue({});
        });

        it('should delete user', async () => {
            const result = await deleteUser('user-2', 'admin-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.user.delete).toHaveBeenCalledWith({
                where: { id: 'user-2' },
            });
        });

        it('should not delete admin users', async () => {
            mockPrisma.user.findUnique.mockResolvedValueOnce(mockUsers[0]); // ADMIN

            const result = await deleteUser('user-1', 'admin-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Cannot delete admin users');
        });

        it('should create audit log with email', async () => {
            await deleteUser('user-2', 'admin-1');

            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    action: 'DELETE_USER',
                    details: { email: 'jane@example.com' },
                }),
            });
        });
    });

    // ========================================
    // Get User Stats Tests
    // ========================================
    describe('getUserStats', () => {
        beforeEach(() => {
            mockPrisma.user.count
                .mockResolvedValueOnce(100) // total
                .mockResolvedValueOnce(5) // ADMIN
                .mockResolvedValueOnce(15) // EDITOR
                .mockResolvedValueOnce(80); // USER
        });

        it('should return user stats', async () => {
            const result = await getUserStats();

            expect(result.success).toBe(true);
            expect(result.data.total).toBe(100);
            expect(result.data.byRole).toEqual({
                ADMIN: 5,
                EDITOR: 15,
                USER: 80,
            });
        });
    });
});
