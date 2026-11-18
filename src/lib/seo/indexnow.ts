import { getBaseUrl } from "@/lib/url";

const DEFAULT_INDEXNOW_KEY = "7e4d9a2c8b1f6053e9c4a7d28b501f6e";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

export function getIndexNowKey(): string {
    const envKey = process.env.INDEXNOW_KEY?.trim();
    if (envKey && /^[a-zA-Z0-9-]{8,128}$/.test(envKey)) {
        return envKey;
    }
    return DEFAULT_INDEXNOW_KEY;
}

export function getIndexNowKeyLocation(baseUrl = getBaseUrl()): string {
    return `${baseUrl.replace(/\/+$/, "")}/indexnow-key.txt`;
}

export interface IndexNowPingResult {
    submitted: boolean;
    status?: number;
    urlCount: number;
    skippedReason?: string;
}

/**
 * Notifies IndexNow (Bing, ChatGPT Search index, Microsoft Copilot, Yandex, Naver)
 * about created or updated public URLs. Safe no-op on localhost / test environments.
 */
export async function notifyIndexNow(
    urls: string[],
    options?: { baseUrl?: string; allowNonProd?: boolean }
): Promise<IndexNowPingResult> {
    const baseUrl = (options?.baseUrl || getBaseUrl()).replace(/\/+$/, "");

    if (
        !options?.allowNonProd &&
        (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1"))
    ) {
        return {
            submitted: false,
            urlCount: 0,
            skippedReason: "local-host-skipped",
        };
    }

    let host: string;
    try {
        host = new URL(baseUrl).hostname;
    } catch {
        return {
            submitted: false,
            urlCount: 0,
            skippedReason: "invalid-base-url",
        };
    }

    const dedupedUrls = Array.from(
        new Set(
            urls
                .map((u) => u.trim())
                .filter((u) => {
                    try {
                        return new URL(u).hostname === host;
                    } catch {
                        return false;
                    }
                })
        )
    ).slice(0, 10000);

    if (dedupedUrls.length === 0) {
        return {
            submitted: false,
            urlCount: 0,
            skippedReason: "no-matching-host-urls",
        };
    }

    const key = getIndexNowKey();
    const keyLocation = getIndexNowKeyLocation(baseUrl);

    try {
        const res = await fetch(INDEXNOW_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify({
                host,
                key,
                keyLocation,
                urlList: dedupedUrls,
            }),
        });

        return {
            submitted: res.status >= 200 && res.status < 300,
            status: res.status,
            urlCount: dedupedUrls.length,
        };
    } catch {
        return {
            submitted: false,
            urlCount: dedupedUrls.length,
            skippedReason: "network-error",
        };
    }
}
