/**
 * Captures the visible chart area using the Screen Capture API.
 * Falls back gracefully when the API is unavailable or user denies permission.
 */

interface CaptureResult {
    ok: boolean;
    blob?: Blob;
    error?: "UNSUPPORTED" | "DENIED" | "FAILED";
}

export function isScreenCaptureSupported(): boolean {
    return (
        typeof navigator !== "undefined" &&
        !!navigator.mediaDevices &&
        typeof navigator.mediaDevices.getDisplayMedia === "function"
    );
}

export async function captureChartArea(
    chartContainer: HTMLDivElement
): Promise<CaptureResult> {
    if (!isScreenCaptureSupported()) {
        return { ok: false, error: "UNSUPPORTED" };
    }

    let stream: MediaStream | null = null;

    try {
        // Request screen capture — preferCurrentTab auto-selects current tab (Chrome 109+)
        stream = await navigator.mediaDevices.getDisplayMedia({
            video: { displaySurface: "browser" } as MediaTrackConstraints,
            // @ts-expect-error -- Chrome-specific: pre-selects current tab
            preferCurrentTab: true,
        });

        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        await video.play();

        // Wait 2 frames for stable render
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

        // Draw full tab to canvas
        const fullCanvas = document.createElement("canvas");
        fullCanvas.width = video.videoWidth;
        fullCanvas.height = video.videoHeight;
        const ctx = fullCanvas.getContext("2d");
        if (!ctx) return { ok: false, error: "FAILED" };

        ctx.drawImage(video, 0, 0);

        // Stop stream immediately after capture
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
        video.srcObject = null;

        // Crop to chart container bounds
        const rect = chartContainer.getBoundingClientRect();
        const scaleX = video.videoWidth / window.innerWidth;
        const scaleY = video.videoHeight / window.innerHeight;

        const cropW = Math.round(rect.width * scaleX);
        const cropH = Math.round(rect.height * scaleY);
        const cropX = Math.round(rect.left * scaleX);
        const cropY = Math.round(rect.top * scaleY);

        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext("2d");
        if (!cropCtx) return { ok: false, error: "FAILED" };

        cropCtx.drawImage(fullCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        // Convert to blob
        const blob = await new Promise<Blob | null>((resolve) => {
            cropCanvas.toBlob((b) => resolve(b), "image/png");
        });

        if (!blob) return { ok: false, error: "FAILED" };

        return { ok: true, blob };
    } catch (err) {
        // User clicked "Cancel" on the share dialog
        if (err instanceof DOMException && err.name === "NotAllowedError") {
            return { ok: false, error: "DENIED" };
        }
        console.error("[captureChartArea]", err);
        return { ok: false, error: "FAILED" };
    } finally {
        // Ensure stream is always stopped
        stream?.getTracks().forEach((t) => t.stop());
    }
}
