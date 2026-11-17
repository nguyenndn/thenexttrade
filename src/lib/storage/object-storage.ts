import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path";

// Parse env vars (read runtime env first so container env changes take effect without rebuild)
const R2_ENDPOINT = process.env.R2_ENDPOINT || "";
const R2_REGION = process.env.R2_REGION || "auto";
const R2_BUCKET = process.env.R2_BUCKET || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";

function getAssetPublicBaseUrl(): string {
    return (
        process.env["R2_PUBLIC_URL"] ||
        process.env["NEXT_PUBLIC_R2_PUBLIC_URL"] ||
        process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
        ""
    ).replace(/\/+$/, "");
}

/**
 * Prefix public R2 directories with `dev/` in local development so local uploads
 * never collide with Production keys on a shared Cloudflare R2 bucket.
 */
export function resolveStorageDirectory(
    directory: string,
    nodeEnv: string | undefined = process.env.NODE_ENV
): string {
    const cleanDir = directory.replace(/^\/+|\/+$/g, "");
    if (nodeEnv === "development") {
        return cleanDir.startsWith("dev/") ? cleanDir : `dev/${cleanDir}`;
    }
    return cleanDir;
}

/**
 * Guard R2 object deletion by environment namespace:
 * - `development` may ONLY delete `dev/*` objects (never touches Production assets).
 * - `production` (and non-dev) may ONLY delete non-`dev/*` objects (never touches Local Dev assets).
 */
export function canDeleteAssetKeyInEnv(
    key: string,
    nodeEnv: string | undefined = process.env.NODE_ENV
): boolean {
    const cleanKey = key.replace(/^\/+/, "");
    if (!cleanKey || cleanKey.startsWith("mt5/") || cleanKey.includes("..")) {
        return false;
    }
    if (nodeEnv === "development") {
        return cleanKey.startsWith("dev/");
    }
    return !cleanKey.startsWith("dev/");
}

export const isR2Configured = Boolean(
    R2_ENDPOINT &&
        R2_BUCKET &&
        R2_ACCESS_KEY_ID &&
        R2_SECRET_ACCESS_KEY &&
        getAssetPublicBaseUrl()
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
    const sanitizedName = path
        .basename(originalFilename, ext)
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase();
    const scopedDirectory = resolveStorageDirectory(directory);
    const uniqueFilename = `${sanitizedName}-${crypto.randomUUID()}${ext}`;
    const key = `${scopedDirectory}/${uniqueFilename}`;

    try {
        await r2Client.send(
            new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
                Body: buffer,
                ContentType: contentType,
                CacheControl: "public, max-age=31536000, immutable",
            })
        );

        return getPublicAssetUrl(key);
    } catch (error) {
        console.error("[ObjectStorage] Failed to upload asset:", error);
        return null;
    }
}

/**
 * Delete an object from object storage (supports both custom CDN domain and legacy *.r2.dev URLs)
 */
export async function deletePublicAsset(url: string): Promise<boolean> {
    const baseUrl = getAssetPublicBaseUrl();
    if (!isR2Configured || !r2Client || !url) {
        return false;
    }

    try {
        const parsed = new URL(url);
        let configuredHost = "";
        try {
            configuredHost = new URL(baseUrl).hostname.toLowerCase();
        } catch {
            /* ignore */
        }
        const host = parsed.hostname.toLowerCase();
        if (host !== configuredHost && !host.endsWith(".r2.dev")) {
            return false;
        }

        const key = parsed.pathname.replace(/^\/+/, "");
        if (!canDeleteAssetKeyInEnv(key)) {
            return false;
        }

        await r2Client.send(
            new DeleteObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
            })
        );
        return true;
    } catch (error) {
        console.error("[ObjectStorage] Failed to delete asset:", error);
        return false;
    }
}

/**
 * Construct the public CDN URL
 */
export function getPublicAssetUrl(key: string): string {
    return `${getAssetPublicBaseUrl()}/${key.replace(/^\/+/, "")}`;
}

export async function uploadProtectedAsset(
    buffer: Buffer,
    key: string,
    contentType: string
): Promise<boolean> {
    if (!isR2Configured || !r2Client) {
        return false;
    }
    try {
        await r2Client.send(
            new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
                Body: buffer,
                ContentType: contentType,
                CacheControl: "no-cache",
            })
        );
        return true;
    } catch (error) {
        console.error(
            "[ObjectStorage] Failed to upload protected asset:",
            error
        );
        return false;
    }
}

export async function getProtectedAssetStream(key: string) {
    if (!isR2Configured || !r2Client) {
        return null;
    }
    try {
        const { GetObjectCommand } = await import("@aws-sdk/client-s3");
        const response = await r2Client.send(
            new GetObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
            })
        );
        return response.Body;
    } catch (error) {
        console.error("[ObjectStorage] Failed to get protected asset:", error);
        return null;
    }
}
