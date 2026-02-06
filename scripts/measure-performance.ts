/**
 * Performance Measurement Script
 * 
 * Purpose: Measure baseline metrics before optimization
 * Run: npx tsx scripts/measure-performance.ts
 * 
 * Metrics:
 * - Database query times
 * - API response times
 * - Bundle sizes
 * - Memory usage
 */

import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface PerformanceResult {
    test: string;
    duration: number;
    queryCount?: number;
    recordCount?: number;
    memory?: number;
}

const results: PerformanceResult[] = [];

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function measureQuery(name: string, queryFn: () => Promise<any>) {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = performance.now();

    const result = await queryFn();

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;
    const duration = endTime - startTime;
    const memoryUsed = Math.abs((endMemory - startMemory) / 1024 / 1024); // MB

    const recordCount = Array.isArray(result) ? result.length : 1;

    results.push({
        test: name,
        duration: Math.round(duration),
        recordCount,
        memory: Math.round(memoryUsed * 100) / 100
    });

    const status = duration > 500 ? 'red' : duration > 200 ? 'yellow' : 'green';
    log(`✓ ${name}: ${Math.round(duration)}ms (${recordCount} records, ${Math.round(memoryUsed * 100) / 100}MB)`, status);

    return result;
}

async function measureDatabasePerformance() {
    log('\n📊 MEASURING DATABASE PERFORMANCE\n', 'cyan');

    // Test 1: Homepage Featured Articles (Optimized)
    await measureQuery('Homepage Featured Articles', async () => {
        return await prisma.article.findMany({
            where: { status: 'PUBLISHED', isFeatured: true },
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                thumbnail: true,
                createdAt: true,
                author: { select: { name: true, image: true } },
                category: { select: { name: true, slug: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 3
        });
    });

    // Test 3: Library Pagination (without index)
    await measureQuery('Library Page - Pagination', async () => {
        return await prisma.article.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: { createdAt: 'desc' },
            take: 20,
            skip: 0
        });
    });

    // Test 4: Article with Related (Sequential - BAD)
    await measureQuery('Article Page - Sequential Queries', async () => {
        const article = await prisma.article.findFirst({
            where: { status: 'PUBLISHED' }
        });

        if (!article) return null;

        const related = await prisma.article.findMany({
            where: {
                status: 'PUBLISHED',
                slug: { not: article.slug }
            },
            take: 3,
            orderBy: { views: 'desc' }
        });

        return { article, related };
    });

    // Test 5: Article with Related (Parallel - GOOD)
    await measureQuery('Article Page - Parallel Queries', async () => {
        const articlePromise = prisma.article.findFirst({
            where: { status: 'PUBLISHED' },
            select: {
                id: true,
                title: true,
                slug: true,
                content: true,
                excerpt: true,
                thumbnail: true,
                createdAt: true,
                author: { select: { name: true, image: true } }
            }
        });

        const relatedPromise = prisma.article.findMany({
            where: { status: 'PUBLISHED' },
            take: 3,
            orderBy: { views: 'desc' },
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                thumbnail: true
            }
        });

        const [article, related] = await Promise.all([articlePromise, relatedPromise]);
        return { article, related };
    });

    // Test 6: Admin Dashboard Stats (Parallel - Already Good)
    await measureQuery('Admin Dashboard - Parallel Stats', async () => {
        const [usersCount, articlesCount, lessonsCount] = await Promise.all([
            prisma.user.count(),
            prisma.article.count({ where: { status: 'PUBLISHED' } }),
            prisma.lesson.count()
        ]);
        return { usersCount, articlesCount, lessonsCount };
    });

    // Test 7: Academy Page with Nested Includes
    await measureQuery('Academy Page - Nested Includes', async () => {
        return await prisma.level.findMany({
            include: {
                modules: {
                    include: {
                        lessons: true
                    }
                }
            },
            orderBy: { order: 'asc' }
        });
    });

    // Test 8: Academy Page with Select (Optimized)
    await measureQuery('Academy Page - Optimized Select', async () => {
        return await prisma.level.findMany({
            select: {
                id: true,
                title: true,
                order: true,
                modules: {
                    select: {
                        id: true,
                        title: true,
                        lessons: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                duration: true
                            }
                        }
                    }
                }
            },
            orderBy: { order: 'asc' }
        });
    });

    // Test 9: Users with Progress Count (N+1 Risk)
    await measureQuery('Admin Users - OrderBy with Count', async () => {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                _count: {
                    select: { progress: { where: { isCompleted: true } } }
                }
            },
            take: 10
        });

        // Manual sort
        return users.sort((a, b) => b._count.progress - a._count.progress).slice(0, 5);
    });

    // Test 10: Search Query (Full Text)
    await measureQuery('Search - Article + Lesson', async () => {
        const searchQuery = 'forex';

        const [articles, lessons] = await Promise.all([
            prisma.article.findMany({
                where: {
                    status: 'PUBLISHED',
                    OR: [
                        { title: { contains: searchQuery, mode: 'insensitive' } },
                        { excerpt: { contains: searchQuery, mode: 'insensitive' } }
                    ]
                },
                take: 5
            }),
            prisma.lesson.findMany({
                where: {
                    title: { contains: searchQuery, mode: 'insensitive' }
                },
                take: 5
            })
        ]);

        return { articles, lessons };
    });
}

async function analyzeBundleSize() {
    log('\n📦 ANALYZING BUNDLE SIZE\n', 'cyan');

    const nextDir = path.join(process.cwd(), '.next');

    if (!fs.existsSync(nextDir)) {
        log('⚠️  No .next directory found. Run "npm run build" first.', 'yellow');
        return;
    }

    try {
        const buildManifest = path.join(nextDir, 'build-manifest.json');
        if (fs.existsSync(buildManifest)) {
            const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf-8'));

            log('Main Bundles:', 'blue');

            const pages = manifest.pages || {};
            for (const [page, files] of Object.entries(pages)) {
                if (Array.isArray(files)) {
                    const totalSize = files.reduce((acc: number, file: string) => {
                        const filePath = path.join(nextDir, file);
                        if (fs.existsSync(filePath)) {
                            return acc + fs.statSync(filePath).size;
                        }
                        return acc;
                    }, 0);

                    const sizeKB = (totalSize / 1024).toFixed(2);
                    const color = totalSize > 200000 ? 'red' : totalSize > 100000 ? 'yellow' : 'green';
                    log(`  ${page}: ${sizeKB} KB`, color);
                }
            }
        }
    } catch (error) {
        log(`Error analyzing bundle: ${error}`, 'red');
    }
}

function generateReport() {
    log('\n📈 PERFORMANCE REPORT\n', 'cyan');

    // Group by performance thresholds
    const fast = results.filter(r => r.duration < 100);
    const medium = results.filter(r => r.duration >= 100 && r.duration < 300);
    const slow = results.filter(r => r.duration >= 300);

    log('Fast Queries (<100ms):', 'green');
    fast.forEach(r => log(`  ✓ ${r.test}: ${r.duration}ms`, 'green'));

    log('\nMedium Queries (100-300ms):', 'yellow');
    medium.forEach(r => log(`  ⚠ ${r.test}: ${r.duration}ms`, 'yellow'));

    log('\nSlow Queries (>300ms):', 'red');
    slow.forEach(r => log(`  ✗ ${r.test}: ${r.duration}ms`, 'red'));

    // Calculate averages
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const totalMemory = results.reduce((sum, r) => sum + (r.memory || 0), 0);

    log('\nSummary:', 'blue');
    log(`  Total Tests: ${results.length}`, 'blue');
    log(`  Average Query Time: ${Math.round(avgDuration)}ms`, 'blue');
    log(`  Total Memory Used: ${Math.round(totalMemory * 100) / 100}MB`, 'blue');

    // Save to JSON
    const reportPath = path.join(process.cwd(), 'performance-baseline.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        results,
        summary: {
            totalTests: results.length,
            fastQueries: fast.length,
            mediumQueries: medium.length,
            slowQueries: slow.length,
            avgDuration: Math.round(avgDuration),
            totalMemory: Math.round(totalMemory * 100) / 100
        }
    }, null, 2));

    log(`\n✓ Report saved to: ${reportPath}`, 'green');
}

async function main() {
    console.clear();
    log('╔════════════════════════════════════════════════════════════════╗', 'cyan');
    log('║       GSN-CRM PERFORMANCE BASELINE MEASUREMENT                 ║', 'cyan');
    log('║       Before Optimization - Baseline Metrics                   ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════════╝', 'cyan');

    try {
        await measureDatabasePerformance();
        await analyzeBundleSize();
        generateReport();

        log('\n✅ Performance measurement complete!\n', 'green');
        log('Next Steps:', 'cyan');
        log('  1. Review performance-baseline.json', 'blue');
        log('  2. Implement optimizations from PERFORMANCE_OPTIMIZATION_SPEC.md', 'blue');
        log('  3. Run this script again to compare results', 'blue');
    } catch (error) {
        log(`\n❌ Error: ${error}`, 'red');
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
