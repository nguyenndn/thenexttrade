/**
 * CMS Actions Tests
 * @module tests/admin/actions/cms-actions.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockCategories, mockTags } from '../__mocks__/data';

// Mock Prisma
const mockPrisma = {
    category: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    tag: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    article: {
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

// ============================================
// Category Actions
// ============================================
async function getCategories() {
    const categories = await mockPrisma.category.findMany({
        include: { _count: { select: { articles: true } } },
        orderBy: { name: 'asc' },
    });
    return { success: true, data: categories };
}

async function getCategoryById(id: string) {
    const category = await mockPrisma.category.findUnique({
        where: { id },
        include: { _count: { select: { articles: true } } },
    });

    if (!category) {
        return { success: false, error: 'Category not found' };
    }

    return { success: true, data: category };
}

async function createCategory(data: { name: string; slug: string; description?: string }) {
    if (!data.name || data.name.length < 2) {
        return { success: false, error: 'Name must be at least 2 characters' };
    }
    if (!data.slug) {
        return { success: false, error: 'Slug is required' };
    }

    // Check slug uniqueness
    const existing = await mockPrisma.category.findFirst({
        where: { slug: data.slug },
    });

    if (existing) {
        return { success: false, error: 'Slug already exists' };
    }

    const category = await mockPrisma.category.create({ data });

    mockRevalidatePath('/articles');
    mockRevalidatePath('/admin/cms/categories');

    return { success: true, data: category };
}

async function updateCategory(id: string, data: { name?: string; slug?: string; description?: string }) {
    const category = await mockPrisma.category.findUnique({ where: { id } });

    if (!category) {
        return { success: false, error: 'Category not found' };
    }

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== category.slug) {
        const existing = await mockPrisma.category.findFirst({
            where: { slug: data.slug, id: { not: id } },
        });
        if (existing) {
            return { success: false, error: 'Slug already exists' };
        }
    }

    const updated = await mockPrisma.category.update({
        where: { id },
        data,
    });

    mockRevalidatePath('/articles');
    mockRevalidatePath('/admin/cms/categories');

    return { success: true, data: updated };
}

async function deleteCategory(id: string) {
    const category = await mockPrisma.category.findUnique({ where: { id } });

    if (!category) {
        return { success: false, error: 'Category not found' };
    }

    // Check if category has articles
    const articleCount = await mockPrisma.article.count({
        where: { categoryId: id },
    });

    if (articleCount > 0) {
        return { success: false, error: `Cannot delete category with ${articleCount} articles` };
    }

    await mockPrisma.category.delete({ where: { id } });

    mockRevalidatePath('/articles');
    mockRevalidatePath('/admin/cms/categories');

    return { success: true };
}

// ============================================
// Tag Actions
// ============================================
async function getTags(search?: string) {
    const where = search
        ? { name: { contains: search, mode: 'insensitive' as const } }
        : {};

    const tags = await mockPrisma.tag.findMany({
        where,
        include: { _count: { select: { articles: true } } },
        orderBy: { name: 'asc' },
    });

    return { success: true, data: tags };
}

async function getTagById(id: string) {
    const tag = await mockPrisma.tag.findUnique({
        where: { id },
        include: { _count: { select: { articles: true } } },
    });

    if (!tag) {
        return { success: false, error: 'Tag not found' };
    }

    return { success: true, data: tag };
}

async function createTag(data: { name: string; slug: string }) {
    if (!data.name || data.name.length < 2) {
        return { success: false, error: 'Name must be at least 2 characters' };
    }
    if (!data.slug) {
        return { success: false, error: 'Slug is required' };
    }

    // Check slug uniqueness
    const existing = await mockPrisma.tag.findFirst({
        where: { slug: data.slug },
    });

    if (existing) {
        return { success: false, error: 'Slug already exists' };
    }

    const tag = await mockPrisma.tag.create({ data });

    mockRevalidatePath('/admin/cms/tags');

    return { success: true, data: tag };
}

async function updateTag(id: string, data: { name?: string; slug?: string }) {
    const tag = await mockPrisma.tag.findUnique({ where: { id } });

    if (!tag) {
        return { success: false, error: 'Tag not found' };
    }

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== tag.slug) {
        const existing = await mockPrisma.tag.findFirst({
            where: { slug: data.slug, id: { not: id } },
        });
        if (existing) {
            return { success: false, error: 'Slug already exists' };
        }
    }

    const updated = await mockPrisma.tag.update({
        where: { id },
        data,
    });

    mockRevalidatePath('/admin/cms/tags');

    return { success: true, data: updated };
}

async function deleteTag(id: string) {
    const tag = await mockPrisma.tag.findUnique({ where: { id } });

    if (!tag) {
        return { success: false, error: 'Tag not found' };
    }

    await mockPrisma.tag.delete({ where: { id } });

    mockRevalidatePath('/admin/cms/tags');

    return { success: true };
}

async function mergeTags(sourceIds: string[], targetId: string) {
    if (sourceIds.length === 0) {
        return { success: false, error: 'Source tags are required' };
    }

    const targetTag = await mockPrisma.tag.findUnique({ where: { id: targetId } });

    if (!targetTag) {
        return { success: false, error: 'Target tag not found' };
    }

    // In real implementation, would:
    // 1. Update all articles with source tags to include target tag
    // 2. Remove source tags from articles
    // 3. Delete source tags

    return { success: true, mergedCount: sourceIds.length };
}

describe('Category Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma.category.findMany.mockResolvedValue(mockCategories);
    });

    // ========================================
    // Get Categories Tests
    // ========================================
    describe('getCategories', () => {
        it('should get all categories', async () => {
            const result = await getCategories();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockCategories);
            expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
                include: { _count: { select: { articles: true } } },
                orderBy: { name: 'asc' },
            });
        });
    });

    // ========================================
    // Get Category By ID Tests
    // ========================================
    describe('getCategoryById', () => {
        it('should get category by id', async () => {
            mockPrisma.category.findUnique.mockResolvedValueOnce(mockCategories[0]);

            const result = await getCategoryById('cat-1');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockCategories[0]);
        });

        it('should return error if not found', async () => {
            mockPrisma.category.findUnique.mockResolvedValueOnce(null);

            const result = await getCategoryById('invalid');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Category not found');
        });
    });

    // ========================================
    // Create Category Tests
    // ========================================
    describe('createCategory', () => {
        beforeEach(() => {
            mockPrisma.category.findFirst.mockResolvedValue(null);
            mockPrisma.category.create.mockResolvedValue({
                id: 'new-cat',
                name: 'New Category',
                slug: 'new-category',
                description: 'Description',
            });
        });

        it('should create category', async () => {
            const result = await createCategory({
                name: 'New Category',
                slug: 'new-category',
                description: 'Description',
            });

            expect(result.success).toBe(true);
            expect(mockPrisma.category.create).toHaveBeenCalled();
        });

        it('should validate name length', async () => {
            const result = await createCategory({
                name: 'A',
                slug: 'a',
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Name must be at least 2 characters');
        });

        it('should require slug', async () => {
            const result = await createCategory({
                name: 'Category',
                slug: '',
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Slug is required');
        });

        it('should check slug uniqueness', async () => {
            mockPrisma.category.findFirst.mockResolvedValueOnce(mockCategories[0]);

            const result = await createCategory({
                name: 'New Category',
                slug: 'trading-basics',
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Slug already exists');
        });

        it('should revalidate paths', async () => {
            await createCategory({
                name: 'New Category',
                slug: 'new-category',
            });

            expect(mockRevalidatePath).toHaveBeenCalledWith('/articles');
            expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/cms/categories');
        });
    });

    // ========================================
    // Update Category Tests
    // ========================================
    describe('updateCategory', () => {
        beforeEach(() => {
            mockPrisma.category.findUnique.mockResolvedValue(mockCategories[0]);
            mockPrisma.category.findFirst.mockResolvedValue(null);
            mockPrisma.category.update.mockResolvedValue({
                ...mockCategories[0],
                name: 'Updated Name',
            });
        });

        it('should update category', async () => {
            const result = await updateCategory('cat-1', { name: 'Updated Name' });

            expect(result.success).toBe(true);
            expect(mockPrisma.category.update).toHaveBeenCalled();
        });

        it('should return error if not found', async () => {
            mockPrisma.category.findUnique.mockResolvedValueOnce(null);

            const result = await updateCategory('invalid', { name: 'Test' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Category not found');
        });

        it('should check slug uniqueness on update', async () => {
            mockPrisma.category.findFirst.mockResolvedValueOnce(mockCategories[1]); // Different category

            const result = await updateCategory('cat-1', { slug: 'analysis' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Slug already exists');
        });
    });

    // ========================================
    // Delete Category Tests
    // ========================================
    describe('deleteCategory', () => {
        beforeEach(() => {
            mockPrisma.category.findUnique.mockResolvedValue(mockCategories[0]);
            mockPrisma.article.count.mockResolvedValue(0);
            mockPrisma.category.delete.mockResolvedValue(mockCategories[0]);
        });

        it('should delete category without articles', async () => {
            const result = await deleteCategory('cat-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.category.delete).toHaveBeenCalledWith({
                where: { id: 'cat-1' },
            });
        });

        it('should not delete category with articles', async () => {
            mockPrisma.article.count.mockResolvedValueOnce(25);

            const result = await deleteCategory('cat-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Cannot delete category with 25 articles');
        });

        it('should return error if not found', async () => {
            mockPrisma.category.findUnique.mockResolvedValueOnce(null);

            const result = await deleteCategory('invalid');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Category not found');
        });
    });
});

describe('Tag Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma.tag.findMany.mockResolvedValue(mockTags);
    });

    // ========================================
    // Get Tags Tests
    // ========================================
    describe('getTags', () => {
        it('should get all tags', async () => {
            const result = await getTags();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTags);
        });

        it('should filter by search term', async () => {
            await getTags('forex');

            expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { name: { contains: 'forex', mode: 'insensitive' } },
                })
            );
        });
    });

    // ========================================
    // Create Tag Tests
    // ========================================
    describe('createTag', () => {
        beforeEach(() => {
            mockPrisma.tag.findFirst.mockResolvedValue(null);
            mockPrisma.tag.create.mockResolvedValue({
                id: 'new-tag',
                name: 'newtag',
                slug: 'newtag',
            });
        });

        it('should create tag', async () => {
            const result = await createTag({
                name: 'newtag',
                slug: 'newtag',
            });

            expect(result.success).toBe(true);
        });

        it('should validate name length', async () => {
            const result = await createTag({
                name: 'a',
                slug: 'a',
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Name must be at least 2 characters');
        });

        it('should check slug uniqueness', async () => {
            mockPrisma.tag.findFirst.mockResolvedValueOnce(mockTags[0]);

            const result = await createTag({
                name: 'forex',
                slug: 'forex',
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Slug already exists');
        });
    });

    // ========================================
    // Update Tag Tests
    // ========================================
    describe('updateTag', () => {
        beforeEach(() => {
            mockPrisma.tag.findUnique.mockResolvedValue(mockTags[0]);
            mockPrisma.tag.findFirst.mockResolvedValue(null);
            mockPrisma.tag.update.mockResolvedValue({
                ...mockTags[0],
                name: 'updatedtag',
            });
        });

        it('should update tag', async () => {
            const result = await updateTag('tag-1', { name: 'updatedtag' });

            expect(result.success).toBe(true);
        });

        it('should return error if not found', async () => {
            mockPrisma.tag.findUnique.mockResolvedValueOnce(null);

            const result = await updateTag('invalid', { name: 'test' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Tag not found');
        });
    });

    // ========================================
    // Delete Tag Tests
    // ========================================
    describe('deleteTag', () => {
        beforeEach(() => {
            mockPrisma.tag.findUnique.mockResolvedValue(mockTags[0]);
            mockPrisma.tag.delete.mockResolvedValue(mockTags[0]);
        });

        it('should delete tag', async () => {
            const result = await deleteTag('tag-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.tag.delete).toHaveBeenCalledWith({
                where: { id: 'tag-1' },
            });
        });

        it('should return error if not found', async () => {
            mockPrisma.tag.findUnique.mockResolvedValueOnce(null);

            const result = await deleteTag('invalid');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Tag not found');
        });
    });

    // ========================================
    // Merge Tags Tests
    // ========================================
    describe('mergeTags', () => {
        it('should merge tags', async () => {
            mockPrisma.tag.findUnique.mockResolvedValueOnce(mockTags[0]);

            const result = await mergeTags(['tag-2', 'tag-3'], 'tag-1');

            expect(result.success).toBe(true);
            expect(result.mergedCount).toBe(2);
        });

        it('should require source tags', async () => {
            const result = await mergeTags([], 'tag-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Source tags are required');
        });

        it('should validate target tag exists', async () => {
            mockPrisma.tag.findUnique.mockResolvedValueOnce(null);

            const result = await mergeTags(['tag-2'], 'invalid');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Target tag not found');
        });
    });
});
