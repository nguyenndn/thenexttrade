import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { uploadPublicAsset, isR2Configured } from '../src/lib/storage/object-storage';

const prisma = new PrismaClient();

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function main() {
    if (!isR2Configured) {
        console.error('Cloudflare R2 is not configured. Please set the environment variables.');
        process.exit(1);
    }

    console.log('Starting migration to Cloudflare R2...');

    // 1. Migrate Media from DB
    const mediaItems = await prisma.media.findMany({
        where: {
            url: { startsWith: '/uploads/' }
        }
    });

    console.log(`Found ${mediaItems.length} media items to migrate.`);

    let successCount = 0;
    let failCount = 0;

    for (const media of mediaItems) {
        const localPath = path.join(process.cwd(), 'public', media.url.replace(/^\//, ''));
        const thumbLocalPath = media.thumbnailUrl ? path.join(process.cwd(), 'public', media.thumbnailUrl.replace(/^\//, '')) : null;

        if (await fileExists(localPath)) {
            const buffer = await fs.readFile(localPath);
            const r2Url = await uploadPublicAsset(buffer, 'uploads', media.filename, media.type);

            let thumbR2Url: string | null = null;
            if (thumbLocalPath && await fileExists(thumbLocalPath)) {
                const thumbBuffer = await fs.readFile(thumbLocalPath);
                thumbR2Url = await uploadPublicAsset(thumbBuffer, 'uploads', path.basename(thumbLocalPath), media.type);
            }

            if (r2Url) {
                await prisma.media.update({
                    where: { id: media.id },
                    data: {
                        url: r2Url,
                        thumbnailUrl: thumbR2Url || media.thumbnailUrl
                    }
                });
                console.log(`Migrated: ${media.filename} -> ${r2Url}`);
                successCount++;
            } else {
                console.error(`Failed to upload ${media.filename} to R2.`);
                failCount++;
            }
        } else {
            console.error(`Local file missing: ${localPath}`);
            failCount++;
        }
    }

    console.log(`Migration Complete. Success: ${successCount}, Fail: ${failCount}`);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(() => {
    prisma.$disconnect();
});
