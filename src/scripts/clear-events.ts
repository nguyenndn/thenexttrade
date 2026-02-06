
import { prisma } from '../lib/prisma';

async function main() {
    console.log('Deleting all Economic Events...');
    await prisma.economicEvent.deleteMany({});
    console.log('Deleted all events.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
