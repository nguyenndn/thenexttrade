import cron from 'node-cron';
import { prisma } from '@/lib/prisma';

// This service should be initialized when the server starts
// In Next.js App Router, it's tricky to have a persistent singleton.
// We'll use a pragmatic approach: The cron runs every minute to check for specific articles.

export class ArticleSchedulerService {
    private static isRunning = false;

    static init() {
        if (this.isRunning) return;

        console.log("Initializing Article Scheduler...");

        // Run every minute
        cron.schedule('* * * * *', async () => {
            await this.publishScheduledArticles();
        });

        this.isRunning = true;
    }

    static async publishScheduledArticles() {
        try {
            const now = new Date();

            // Find articles that are DRAFT or PENDING, have a publishedAt in the past, and are not yet PUBLISHED
            const articles = await prisma.article.findMany({
                where: {
                    status: { not: 'PUBLISHED' },
                    publishedAt: {
                        lte: now, // Less than or equal to now
                        not: null
                    }
                }
            });

            if (articles.length > 0) {
                console.log(`Found ${articles.length} articles to publish.`);

                for (const article of articles) {
                    await prisma.article.update({
                        where: { id: article.id },
                        data: {
                            status: 'PUBLISHED',
                            // potentially clear publishedAt or keep it as the record
                            // keeping it is fine.
                        }
                    });
                    console.log(`Published article: ${article.title} (${article.id})`);
                }
            }
        } catch (error) {
            console.error("Error in Article Scheduler:", error);
        }
    }
}
