import { toast } from "sonner";
import { trackEvent } from "@/lib/track";

interface DownloadProductRef {
    id: string;
    name: string;
    type: string;
}

export async function downloadEaProductBinary(
    product: DownloadProductRef
): Promise<boolean> {
    const res = await fetch(
        `/api/user/downloads/${product.id}?platform=MT5`
    );
    const json = await res.json();

    if (!res.ok || !json.success) {
        const msg =
            json.error?.message || json.error || "Download failed";
        toast.error(msg);
        return false;
    }

    const fileRes = await fetch(json.data.url);
    if (!fileRes.ok) {
        toast.error("Download failed. Please try again.");
        return false;
    }

    const blob = await fileRes.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download =
        json.data.filename ||
        decodeURIComponent(
            json.data.url.split("/").pop()?.split("?")[0] || "download.ex5"
        );
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);

    trackEvent("click_download_ea", {
        productName: product.name,
        productType: product.type,
    });

    return true;
}
