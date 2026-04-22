import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parseISO, endOfDay } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Standard array shuffler using Fisher-Yates algorithm.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Parses an ISO date string into a Date object (Start of Day).
 * If timezone is provided (e.g. "Europe/Athens"), returns midnight in that timezone (as UTC Date).
 * This ensures "Today" boundaries match the broker's MT5 server time.
 */
export function parseLocalStartOfDay(dateString?: string, timezone?: string): Date | undefined {
    if (!dateString) return undefined;
    // Parse as a "wall clock" date: "2026-03-11" => year=2026, month=3, day=11
    const parsed = parseISO(dateString);
    if (timezone) {
        // Create midnight in the broker's timezone, return as UTC Date
        // fromZonedTime("2026-03-11T00:00:00", "Europe/Athens") => UTC equivalent of midnight Athens
        const midnightInTz = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
        return fromZonedTime(midnightInTz, timezone);
    }
    return parsed;
}

/**
 * Parses an ISO date string and forces it to the end of the day (23:59:59.999).
 * If timezone is provided, returns end-of-day in that timezone (as UTC Date).
 */
export function parseLocalEndOfDay(dateString?: string, timezone?: string): Date | undefined {
    if (!dateString) return undefined;
    const parsed = parseISO(dateString);
    if (timezone) {
        // Create 23:59:59.999 in the broker's timezone, return as UTC Date
        const endInTz = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999);
        return fromZonedTime(endInTz, timezone);
    }
    return endOfDay(parsed);
}

/**
 * Builds a Prisma-compatible date range filter object.
 * Accepts an optional timezone to align day boundaries with broker time.
 */
export function buildDateRangeFilter(dateFrom?: string, dateTo?: string, timezone?: string): { gte?: Date; lte?: Date } | undefined {
    if (!dateFrom && !dateTo) return undefined;
    
    const filter: { gte?: Date; lte?: Date } = {};
    if (dateFrom) filter.gte = parseLocalStartOfDay(dateFrom, timezone);
    if (dateTo) filter.lte = parseLocalEndOfDay(dateTo, timezone);
    
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

/**
 * Format date in UTC timezone (broker server time).
 * MT5 deal.time encodes broker time as fake-UTC, so getUTCHours() = broker hours.
 * This avoids local timezone offset corrupting displayed trade times.
 */
export function utcTime(
    date: Date | string,
    fmt: "HH:mm" | "dd MMM HH:mm" | "dd MMM yyyy" | "MMM dd" | "MMM dd, HH:mm" | "yyyy-MM-dd HH:mm" | "yyyy-MM-dd" = "HH:mm"
): string {
    const d = new Date(date);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const yyyy = d.getUTCFullYear();
    const MM = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mon = months[d.getUTCMonth()];
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");

    switch (fmt) {
        case "HH:mm": return `${hh}:${mm}`;
        case "dd MMM HH:mm": return `${dd} ${mon} ${hh}:${mm}`;
        case "dd MMM yyyy": return `${dd} ${mon} ${yyyy}`;
        case "MMM dd": return `${mon} ${dd}`;
        case "MMM dd, HH:mm": return `${mon} ${dd}, ${hh}:${mm}`;
        case "yyyy-MM-dd HH:mm": return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
        case "yyyy-MM-dd": return `${yyyy}-${MM}-${dd}`;
        default: return `${hh}:${mm}`;
    }
}
