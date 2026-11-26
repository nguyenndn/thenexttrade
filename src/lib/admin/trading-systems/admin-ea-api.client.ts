import type { UpdateEAProductInput } from "@/types/ea-license";

export interface AdminEAApiResult<T = undefined> {
    success: boolean;
    error?: string;
    url?: string;
    data?: T;
}

export async function updateAdminEAProduct(
    productId: string,
    payload: UpdateEAProductInput
): Promise<AdminEAApiResult<{ id: string; slug: string }>> {
    try {
        const res = await fetch(
            `/api/admin/trading-systems/${encodeURIComponent(productId)}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            return {
                success: false,
                error: `Update request failed (HTTP ${res.status})`,
            };
        }

        const data = (await res.json()) as AdminEAApiResult<{
            id: string;
            slug: string;
        }>;
        if (!res.ok || !data.success) {
            return {
                success: false,
                error: data.error || `Update failed (HTTP ${res.status})`,
            };
        }
        return data;
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Network error while updating product",
        };
    }
}

export async function uploadAdminEAFile(
    productId: string,
    platform: "MT5" | "THUMBNAIL",
    file: File
): Promise<AdminEAApiResult> {
    try {
        const formData = new FormData();
        formData.append("platform", platform);
        formData.append("file", file);

        const res = await fetch(
            `/api/admin/trading-systems/${encodeURIComponent(productId)}/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            if (res.status === 413) {
                return {
                    success: false,
                    error: "File exceeds maximum upload size allowed by the proxy",
                };
            }
            return {
                success: false,
                error: `Upload failed (HTTP ${res.status})`,
            };
        }

        const data = (await res.json()) as AdminEAApiResult;
        if (!res.ok || !data.success) {
            return {
                success: false,
                error: data.error || `Upload failed (HTTP ${res.status})`,
            };
        }
        return data;
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Network error while uploading file",
        };
    }
}
