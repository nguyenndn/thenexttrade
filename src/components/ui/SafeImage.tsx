"use client";

import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";

interface SafeImageProps extends Omit<ImageProps, "src"> {
    src: string | null | undefined;
    fallbackSrc?: string;
}

export function SafeImage({ 
    src, 
    fallbackSrc = "/images/candlestick-chart-bg.png", 
    alt, 
    ...props 
}: SafeImageProps) {
    const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);

    // If the src prop changes, reset the state
    useEffect(() => {
        setImgSrc(src || fallbackSrc);
    }, [src, fallbackSrc]);

    return (
        <Image
            {...props}
            src={imgSrc}
            alt={alt || ""}
            onError={() => {
                setImgSrc(fallbackSrc);
            }}
        />
    );
}
