import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path";

// Parse env vars dynamically so runtime container env works even without build-time inlining
function getR2Config() {
    return {
        endpoint: process.env.R2_ENDPOINT || "",
        region: process.env.R2_REGION || "auto",
        bucket: process.env.R2_BUCKET || "",
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    };
}

function getAssetPublicBaseUrl(): string {
    return (
        process.env["R2_PUBLIC_URL"] ||
        process.env["ASSET_PUBLIC_BASE_URL"] ||
        process.env["NEXT_PUBLIC_R2_PUBLIC_URL"] ||
        process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
        ""
    ).replace(/\/+$/, "");
}

export function hasR2Credentials(): boolean {
    const cfg = getR2Config();
    return Boolean(
        cfg.endpoint && cfg.bucket && cfg.accessKeyId && cfg.secretAccessKey
    );
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
    hasR2Credentials() && getAssetPublicBaseUrl()
);

let cachedR2Client: S3Client | null = null;
let cachedR2Fingerprint = "";

function getR2Client(): { client: S3Client; bucket: string } | null {
    if (!hasR2Credentials()) {
        return null;
    }
    const cfg = getR2Config();
    const fingerprint = `${cfg.endpoint}|${cfg.region}|${cfg.bucket}|${cfg.accessKeyId}`;
    if (!cachedR2Client || cachedR2Fingerprint !== fingerprint) {
        cachedR2Client = new S3Client({
            region: cfg.region,
            endpoint: cfg.endpoint,
            credentials: {
                accessKeyId: cfg.accessKeyId,
                secretAccessKey: cfg.secretAccessKey,
            },
            // Cloudflare R2 requires path style
            forcePathStyle: true,
        });
        cachedR2Fingerprint = fingerprint;
    }
    return { client: cachedR2Client, bucket: cfg.bucket };
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
    const r2 = getR2Client();
    if (!r2 || !getAssetPublicBaseUrl()) {
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
        await r2.client.send(
            new PutObjectCommand({
                Bucket: r2.bucket,
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
    const r2 = getR2Client();
    if (!r2 || !baseUrl || !url) {
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

        await r2.client.send(
            new DeleteObjectCommand({
                Bucket: r2.bucket,
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
    const r2 = getR2Client();
    if (!r2) {
        return false;
    }
    try {
        await r2.client.send(
            new PutObjectCommand({
                Bucket: r2.bucket,
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
    const r2 = getR2Client();
    if (!r2) {
        return null;
    }
    try {
        const { GetObjectCommand } = await import("@aws-sdk/client-s3");
        const response = await r2.client.send(
            new GetObjectCommand({
                Bucket: r2.bucket,
                Key: key,
            })
        );
        return response.Body;
    } catch (error) {
        console.error("[ObjectStorage] Failed to get protected asset:", error);
        return null;
    }
}
