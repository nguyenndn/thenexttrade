/**
 * Article Actions Tests
 * @module tests/admin/actions/article-actions.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockArticles, mockCategories, mockAuthors } from '../__mocks__/data';

// Mock Prisma
const mockPrisma = {
    article: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    category: {
        findMany: vi.fn(),
    },
    user: {
        findMany: vi.fn(),
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

// Article types
interface ArticleInput {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    thumbnail?: string;
    categoryId: string;
    authorId: string;
    status?: string;
    tags?: string[];
}

// Simulated article actions
async function getArticles(options: {
    status?: string;
    categoryId?: string;
    authorId?: string;
    search?: string;
    limit?: number;
    offset?: number;
}) {
    const where: Record<string, unknown> = {};

    if (options.status && options.status !== 'ALL') {
        where.status = options.status;
    }
    if (options.categoryId) {
        where.categoryId = options.categoryId;
    }
    if (options.authorId) {
        where.authorId = options.authorId;
    }
    if (options.search) {
        where.OR = [
            { title: { contains: options.search, mode: 'insensitive' } },
            { slug: { contains: options.search, mode: 'insensitive' } },
        ];
    }

    const articles = await mockPrisma.article.findMany({
        where,
        take: options.limit || 20,
        skip: options.offset || 0,
        include: { author: true, category: true },
        orderBy: { createdAt: 'desc' },
    });

    const total = await mockPrisma.article.count({ where });

    return { success: true, data: { articles, total } };
}

async function getArticleById(id: string) {
    const article = await mockPrisma.article.findUnique({
        where: { id },
        include: { author: true, category: true, tags: true },
    });

    if (!article) {
        return { success: false, error: 'Article not found' };
    }

    return { success: true, data: article };
}

async function createArticle(data: ArticleInput) {
    // Validation
    if (!data.title || data.title.length < 5) {
        return { success: false, error: 'Title must be at least 5 characters' };
    }
    if (!data.slug) {
        return { success: false, error: 'Slug is required' };
    }
    if (!data.content) {
        return { success: false, error: 'Content is required' };
    }
    if (!data.categoryId) {
        return { success: false, error: 'Category is required' };
    }

    // Check for duplicate slug
    const existing = await mockPrisma.article.findUnique({
        where: { slug: data.slug },
    });

    if (existing) {
        return { success: false, error: 'Slug already exists' };
    }

    const article = await mockPrisma.article.create({
        data: {
            title: data.title,
            slug: data.slug,
            content: data.content,
            excerpt: data.excerpt,
            thumbnail: data.thumbnail,
            categoryId: data.categoryId,
            authorId: data.authorId,
            status: data.status || 'DRAFT',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });

    mockRevalidatePath('/articles');
    mockRevalidatePath('/admin/articles');

    return { success: true, data: article };
}

async function updateArticle(id: string, data: Partial<ArticleInput>) {
    const article = await mockPrisma.article.findUnique({ where: { id } });

    if (!article) {
        return { success: false, error: 'Article not found' };
    }

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== article.slug) {
        const existing = await mockPrisma.article.findUnique({
            where: { slug: data.slug },
        });
        if (existing) {
            return { success: false, error: 'Slug already exists' };
        }
    }

    const updated = await mockPrisma.article.update({
        where: { id },
        data: {
            ...data,
            updatedAt: new Date(),
        },
    });

    mockRevalidatePath('/articles');
    mockRevalidatePath(`/articles/${updated.slug}`);
    mockRevalidatePath('/admin/articles');

    return { success: true, data: updated };
}

async function deleteArticle(id: string) {
    const article = await mockPrisma.article.findUnique({ where: { id } });

    if (!article) {
        return { success: false, error: 'Article not found' };
    }

    await mockPrisma.article.delete({ where: { id } });

    mockRevalidatePath('/articles');
    mockRevalidatePath('/admin/articles');

    return { success: true };
}

async function publishArticle(id: string) {
    const article = await mockPrisma.article.findUnique({ where: { id } });

    if (!article) {
        return { success: false, error: 'Article not found' };
    }

    if (article.status === 'PUBLISHED') {
        return { success: false, error: 'Article already published' };
    }

    const updated = await mockPrisma.article.update({
        where: { id },
        data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
        },
    });

    mockRevalidatePath('/articles');
    mockRevalidatePath(`/articles/${updated.slug}`);

    return { success: true, data: updated };
}

async function unpublishArticle(id: string) {
    const article = await mockPrisma.article.findUnique({ where: { id } });

    if (!article) {
        return { success: false, error: 'Article not found' };
    }

    if (article.status !== 'PUBLISHED') {
        return { success: false, error: 'Article is not published' };
    }

    const updated = await mockPrisma.article.update({
        where: { id },
        data: { status: 'DRAFT' },
    });

    return { success: true, data: updated };
}

describe('Article Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma.article.findMany.mockResolvedValue(mockArticles);
        mockPrisma.article.count.mockResolvedValue(mockArticles.length);
    });

    // ========================================
    // Get Articles Tests
    // ========================================
    describe('getArticles', () => {
        it('should get all articles', async () => {
            const result = await getArticles({});

            expect(result.success).toBe(true);
            expect(result.data.articles).toEqual(mockArticles);
        });

        it('should filter by status', async () => {
            await getArticles({ status: 'PUBLISHED' });

            expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: 'PUBLISHED' },
                })
            );
        });

        it('should filter by category', async () => {
            await getArticles({ categoryId: 'cat-1' });

            expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { categoryId: 'cat-1' },
                })
            );
        });

        it('should filter by author', async () => {
            await getArticles({ authorId: 'user-1' });

            expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { authorId: 'user-1' },
                })
            );
        });

        it('should search by title', async () => {
            await getArticles({ search: 'forex' });

            expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        OR: [
                            { title: { contains: 'forex', mode: 'insensitive' } },
                            { slug: { contains: 'forex', mode: 'insensitive' } },
                        ],
                    },
                })
            );
        });

        it('should apply pagination', async () => {
            await getArticles({ limit: 10, offset: 20 });

            expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 10,
                    skip: 20,
                })
            );
        });
    });

    // ========================================
    // Get Article By ID Tests
    // ========================================
    describe('getArticleById', () => {
        it('should get article with relations', async () => {
            mockPrisma.article.findUnique.mockResolvedValueOnce(mockArticles[0]);

            const result = await getArticleById('article-1');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockArticles[0]);
        });

        it('should return error if not found', async () => {
            mockPrisma.article.findUnique.mockResolvedValueOnce(null);

            const result = await getArticleById('invalid');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Article not found');
        });
    });

    // ========================================
    // Create Article Tests
    // ========================================
    describe('createArticle', () => {
        const validData: ArticleInput = {
            title: 'Test Article Title',
            slug: 'test-article-title',
            content: '<p>Article content here</p>',
            categoryId: 'cat-1',
            authorId: 'user-1',
        };

        beforeEach(() => {
            mockPrisma.article.findUnique.mockResolvedValue(null);
            mockPrisma.article.create.mockResolvedValue({
                id: 'new-article',
                ...validData,
                status: 'DRAFT',
            });
        });

        it('should create article', async () => {
            const result = await createArticle(validData);

            expect(result.success).toBe(true);
            expect(mockPrisma.article.create).toHaveBeenCalled();
        });

        it('should revalidate paths', async () => {
            await createArticle(validData);

            expect(mockRevalidatePath).toHaveBeenCalledWith('/articles');
            expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/articles');
        });

        it('should validate title length', async () => {
            const result = await createArticle({ ...validData, title: 'Hi' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Title must be at least 5 characters');
        });

        it('should require slug', async () => {
            const result = await createArticle({ ...validData, slug: '' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Slug is required');
        });

        it('should require content', async () => {
            const result = await createArticle({ ...validData, content: '' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Content is required');
        });

        it('should require category', async () => {
            const result = await createArticle({ ...validData, categoryId: '' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Category is required');
        });

        it('should check for duplicate slug', async () => {
            mockPrisma.article.findUnique.mockResolvedValueOnce(mockArticles[0]);

            const result = await createArticle(validData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Slug already exists');
        });
    });

    // ========================================
    // Update Article Tests
    // ========================================
    describe('updateArticle', () => {
        beforeEach(() => {
            mockPrisma.article.findUnique.mockResolvedValue(mockArticles[0]);
            mockPrisma.article.update.mockResolvedValue({
                ...mockArticles[0],
                title: 'Updated Title',
            });
        });

        it('should update article', async () => {
            const result = await updateArticle('article-1', { title: 'Updated Title' });

            expect(result.success).toBe(true);
            expect(mockPrisma.article.update).toHaveBeenCalled();
        });

        it('should return error if not found', async () => {
            mockPrisma.article.findUnique.mockResolvedValueOnce(null);

            const result = await updateArticle('invalid', { title: 'Test' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Article not found');
        });

        it('should check slug uniqueness on update', async () => {
            mockPrisma.article.findUnique
                .mockResolvedValueOnce(mockArticles[0])
                .mockResolvedValueOnce(mockArticles[1]); // Different article with same slug

            const result = await updateArticle('article-1', { slug: 'existing-slug' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Slug already exists');
        });
    });

    // ========================================
    // Delete Article Tests
    // ========================================
    describe('deleteArticle', () => {
        beforeEach(() => {
            mockPrisma.article.findUnique.mockResolvedValue(mockArticles[0]);
            mockPrisma.article.delete.mockResolvedValue(mockArticles[0]);
        });

        it('should delete article', async () => {
            const result = await deleteArticle('article-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.article.delete).toHaveBeenCalledWith({
                where: { id: 'article-1' },
            });
        });

        it('should revalidate paths', async () => {
            await deleteArticle('article-1');

            expect(mockRevalidatePath).toHaveBeenCalledWith('/articles');
            expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/articles');
        });

        it('should return error if not found', async () => {
            mockPrisma.article.findUnique.mockResolvedValueOnce(null);

            const result = await deleteArticle('invalid');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Article not found');
        });
    });

    // ========================================
    // Publish Article Tests
    // ========================================
    describe('publishArticle', () => {
        beforeEach(() => {
            mockPrisma.article.findUnique.mockResolvedValue({
                ...mockArticles[1], // DRAFT status
            });
            mockPrisma.article.update.mockResolvedValue({
                ...mockArticles[1],
                status: 'PUBLISHED',
            });
        });

        it('should publish draft article', async () => {
            const result = await publishArticle('article-2');

            expect(result.success).toBe(true);
            expect(mockPrisma.article.update).toHaveBeenCalledWith({
                where: { id: 'article-2' },
                data: expect.objectContaining({
                    status: 'PUBLISHED',
                }),
            });
        });

        it('should set publishedAt date', async () => {
            await publishArticle('article-2');

            expect(mockPrisma.article.update).toHaveBeenCalledWith({
                where: { id: 'article-2' },
                data: expect.objectContaining({
                    publishedAt: expect.any(Date),
                }),
            });
        });

        it('should error if already published', async () => {
            mockPrisma.article.findUnique.mockResolvedValueOnce(mockArticles[0]); // PUBLISHED

            const result = await publishArticle('article-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Article already published');
        });
    });

    // ========================================
    // Unpublish Article Tests
    // ========================================
    describe('unpublishArticle', () => {
        beforeEach(() => {
            mockPrisma.article.findUnique.mockResolvedValue(mockArticles[0]); // PUBLISHED
            mockPrisma.article.update.mockResolvedValue({
                ...mockArticles[0],
                status: 'DRAFT',
            });
        });

        it('should unpublish article', async () => {
            const result = await unpublishArticle('article-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.article.update).toHaveBeenCalledWith({
                where: { id: 'article-1' },
                data: { status: 'DRAFT' },
            });
        });

        it('should error if not published', async () => {
            mockPrisma.article.findUnique.mockResolvedValueOnce(mockArticles[1]); // DRAFT

            const result = await unpublishArticle('article-2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Article is not published');
        });
    });
});
