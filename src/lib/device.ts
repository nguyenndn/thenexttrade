"use client";

import { useEffect, useState } from "react";

/**
 * Checks if a user agent string indicates a mobile/tablet sync device.
 */
export function isMobileSyncDeviceUA(userAgent: string): boolean {
    if (!userAgent) return false;
    const ua = userAgent.toLowerCase();
    return /iphone|ipad|ipod|android|webos|blackberry|iemobile|opera mini/i.test(
        ua
    );
}

/**
 * React hook to check if the current device is a mobile device (based on viewport width or UA).
 */
export function useIsMobileSyncDevice() {
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        const checkDevice = () => {
            const widthMobile = window.innerWidth < 768;
            const uaMobile = isMobileSyncDeviceUA(navigator.userAgent);
            setIsMobile(widthMobile || uaMobile);
        };

        // Check on mount
        checkDevice();

        // Check on resize
        window.addEventListener("resize", checkDevice);
        return () => window.removeEventListener("resize", checkDevice);
    }, []);

    return isMobile;
}
