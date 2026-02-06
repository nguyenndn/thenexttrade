
import { PrismaClient, ImpactLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding economic events...');

    // Clear existing events
    await prisma.economicEvent.deleteMany();

    const events = [
        {
            title: 'Non-Farm Employment Change',
            currency: 'USD',
            impact: ImpactLevel.HIGH,
            forecast: '185K',
            previous: '227K',
            actual: '199K',
            timeOffset: 0, // Today
        },
        {
            title: 'Unemployment Rate',
            currency: 'USD',
            impact: ImpactLevel.HIGH,
            forecast: '3.9%',
            previous: '3.7%',
            actual: '3.7%',
            timeOffset: 0,
        },
        {
            title: 'CPI m/m',
            currency: 'USD',
            impact: ImpactLevel.HIGH,
            forecast: '0.2%',
            previous: '0.1%',
            actual: null,
            timeOffset: 24, // Tomorrow
        },
        {
            title: 'Core CPI m/m',
            currency: 'USD',
            impact: ImpactLevel.HIGH,
            forecast: '0.3%',
            previous: '0.3%',
            actual: null,
            timeOffset: 24,
        },
        {
            title: 'Main Refinancing Rate',
            currency: 'EUR',
            impact: ImpactLevel.HIGH,
            forecast: '4.50%',
            previous: '4.50%',
            actual: null,
            timeOffset: 48, // Day after tomorrow
        },
        {
            title: 'Monetary Policy Statement',
            currency: 'EUR',
            impact: ImpactLevel.HIGH,
            forecast: null,
            previous: null,
            actual: null,
            timeOffset: 48,
        },
        {
            title: 'GDP m/m',
            currency: 'GBP',
            impact: ImpactLevel.MEDIUM,
            forecast: '0.2%',
            previous: '-0.3%',
            actual: null,
            timeOffset: 2,
        },
        {
            title: 'PPI m/m',
            currency: 'USD',
            impact: ImpactLevel.MEDIUM,
            forecast: '0.1%',
            previous: '0.0%',
            actual: null,
            timeOffset: 26,
        },
        {
            title: 'French Flash Manufacturing PMI',
            currency: 'EUR',
            impact: ImpactLevel.MEDIUM,
            forecast: '42.5',
            previous: '42.1',
            actual: '42.0',
            timeOffset: -24, // Yesterday
        },
        {
            title: 'German Flash Manufacturing PMI',
            currency: 'EUR',
            impact: ImpactLevel.HIGH,
            forecast: '43.1',
            previous: '43.3',
            actual: '43.5',
            timeOffset: -24,
        },
        {
            title: 'BOJ Policy Rate',
            currency: 'JPY',
            impact: ImpactLevel.HIGH,
            forecast: '-0.10%',
            previous: '-0.10%',
            actual: '-0.10%',
            timeOffset: -48,
        },
        {
            title: 'Flash Manufacturing PMI',
            currency: 'GBP',
            impact: ImpactLevel.MEDIUM,
            forecast: '46.7',
            previous: '46.2',
            actual: '47.0',
            timeOffset: -24,
        },
        {
            title: 'Italian 10-y Bond Auction',
            currency: 'EUR',
            impact: ImpactLevel.LOW,
            forecast: null,
            previous: '4.10|1.4',
            actual: null,
            timeOffset: 4,
        }
    ];

    for (const event of events) {
        const eventDate = new Date();
        eventDate.setHours(eventDate.getHours() + event.timeOffset);
        // Align to nearest hour roughly for nicer display
        eventDate.setMinutes(0);
        eventDate.setSeconds(0);
        eventDate.setMilliseconds(0);

        // Spread time a bit within the day
        if (event.currency === 'USD') eventDate.setHours(14, 30); // 8:30 AM EST -> ~14:30 GMT+1/etc (Mock time)
        if (event.currency === 'EUR') eventDate.setHours(10, 0);
        if (event.currency === 'JPY') eventDate.setHours(3, 0);
        if (event.currency === 'GBP') eventDate.setHours(9, 0);

        await prisma.economicEvent.create({
            data: {
                title: event.title,
                currency: event.currency,
                impact: event.impact,
                date: eventDate,
                forecast: event.forecast,
                previous: event.previous,
                actual: event.actual,
            },
        });
    }

    console.log(`Seeded ${events.length} economic events.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
