export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV === 'production') {
        const { ArticleSchedulerService } = await import('@/lib/services/scheduler.service');
        ArticleSchedulerService.init();

        const { EconomicSchedulerService } = await import('@/lib/services/economic-scheduler.service');
        EconomicSchedulerService.init();
    }
}
