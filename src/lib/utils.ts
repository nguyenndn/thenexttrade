import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parseISO, endOfDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses an ISO date string into a Date object (Start of Day in Local Time).
 * Equivalent to parsing "2024-01-01".
 */
export function parseLocalStartOfDay(dateString?: string): Date | undefined {
    return dateString ? parseISO(dateString) : undefined;
}

/**
 * Parses an ISO date string and forces it to the end of the day (23:59:59.999) in Local Time.
 */
export function parseLocalEndOfDay(dateString?: string): Date | undefined {
    return dateString ? endOfDay(parseISO(dateString)) : undefined;
}

/**
 * Builds a Prisma-compatible date range filter object.
 */
export function buildDateRangeFilter(dateFrom?: string, dateTo?: string): { gte?: Date; lte?: Date } | undefined {
    if (!dateFrom && !dateTo) return undefined;
    
    const filter: { gte?: Date; lte?: Date } = {};
    if (dateFrom) filter.gte = parseLocalStartOfDay(dateFrom);
    if (dateTo) filter.lte = parseLocalEndOfDay(dateTo);
    
    return filter;
}

/**
 * DRY: Formats an account object into a standardized label: "[Platform] Type - Broker (AccountNum)"
 * e.g., "[MT4] REAL - Vantage (6000000212)"
 */
export function formatAccountLabel(account: any): string {
    if (!account) return "Unknown Account";
    
    const type = account.accountType ? account.accountType.toUpperCase() : "PERSONAL";
    // Usually we want REAL / DEMO. If it's PERSONAL and user wants REAL/DEMO, let's map it or rely on the DB.
    const displayType = (type === "PERSONAL" || type === "REAL") ? "REAL" : type;
    
    const broker = account.broker || account.name || "Unknown Broker";
    const accNumber = account.accountNumber ? `(${account.accountNumber})` : "";
    const platform = account.platform ? `[${account.platform}] ` : "";

    return `${platform}${displayType} - ${broker} ${accNumber}`.trim();
}

/**
 * Transforms user-provided image URLs (e.g. TradingView /x/ links) 
 * into direct image links (e.g. S3 snapshot PNGs) to avoid Next.js Image rendering errors.
 */
export function transformImageUrl(url: string): string {
    if (!url) return url;
    
    // Check if it's a TradingView share link (https://www.tradingview.com/x/AKp4xoGM/)
    const tvRegex = /tradingview\.com\/x\/([a-zA-Z0-9_-]+)\/?/;
    const match = url.match(tvRegex);
    
    if (match && match[1]) {
        const id = match[1];
        // S3 bucket shard is the lowercase first character of the ID
        const firstChar = id.charAt(0).toLowerCase();
        const s3Url = `https://s3.tradingview.com/snapshots/${firstChar}/${id}.png`;
        
        // Pass the S3 URL through our backend proxy to completely bypass 
        // 1. Client-side AdBlockers (UBlock origin blocks CDN sometimes)
        // 2. Next.js cross-origin strict policies/bugs
        return `/api/proxy-image?url=${encodeURIComponent(s3Url)}`;
    }
    
    return url;
}
