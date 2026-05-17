import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import path from 'path';

// Parse env vars
const R2_ENDPOINT = process.env.R2_ENDPOINT || '';
const R2_REGION = process.env.R2_REGION || 'auto';
const R2_BUCKET = process.env.R2_BUCKET || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const ASSET_PUBLIC_BASE_URL = process.env.ASSET_PUBLIC_BASE_URL || '';

export const isR2Configured = Boolean(
    R2_ENDPOINT && R2_BUCKET && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
);

let r2Client: S3Client | null = null;

if (isR2Configured) {
    r2Client = new S3Client({
        region: R2_REGION,
        endpoint: R2_ENDPOINT,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
        // Cloudflare R2 requires path style
        forcePathStyle: true,
    });
}

/**
 * Upload a buffer to object storage.
 * If R2 is not configured, this will return null and the caller should fallback to local disk.
 */
export async function uploadPublicAsset(
    buffer: Buffer,
    directory: string,
    originalFilename: string,
    contentType: string
): Promise<string | null> {
    if (!isR2Configured || !r2Client) {
        return null;
    }

    const ext = path.extname(originalFilename);
    // Sanitize filename to avoid weird characters
    const sanitizedName = path.basename(originalFilename, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const uniqueFilename = `${sanitizedName}-${crypto.randomUUID()}${ext}`;
    const key = `${directory}/${uniqueFilename}`; // e.g. articles/my-image-123.jpg

    try {
        await r2Client.send(
            new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
                Body: buffer,
                ContentType: contentType,
                // Cache-Control: Cache for 1 year immutable
                CacheControl: 'public, max-age=31536000, immutable',
            })
        );

        // Return the public URL for the CDN
        return getPublicAssetUrl(key);
    } catch (error) {
        console.error('[ObjectStorage] Failed to upload asset:', error);
        return null;
    }
}

/**
 * Delete an object from object storage
 */
export async function deletePublicAsset(url: string): Promise<boolean> {
    if (!isR2Configured || !r2Client || !url.startsWith(ASSET_PUBLIC_BASE_URL)) {
        return false;
    }

    try {
        // Extract the key from the public URL
        const key = url.replace(`${ASSET_PUBLIC_BASE_URL}/`, '');

        await r2Client.send(
            new DeleteObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
            })
        );
        return true;
    } catch (error) {
        console.error('[ObjectStorage] Failed to delete asset:', error);
        return false;
    }
}

/**
 * Construct the public CDN URL
 */
export function getPublicAssetUrl(key: string): string {
    return `${ASSET_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
}
