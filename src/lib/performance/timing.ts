/**
 * Server-side performance timing helper for monitoring slow DB/API queries.
 */

interface TimingThresholds {
 dbWarningMs: number;
 apiWarningMs: number;
 pageWarningMs: number;
}

const DEFAULT_THRESHOLDS: TimingThresholds = {
 dbWarningMs: 300,
 apiWarningMs: 800,
 pageWarningMs: 1000,
};

export async function measurePerformance<T>(
 operationName: string,
 type: 'db' | 'api' | 'page',
 operation: () => Promise<T>
): Promise<T> {
 const start = performance.now();
 try {
 return await operation();
 } finally {
 const end = performance.now();
 const duration = end - start;

 let threshold = DEFAULT_THRESHOLDS.pageWarningMs;
 if (type === 'db') threshold = DEFAULT_THRESHOLDS.dbWarningMs;
 if (type === 'api') threshold = DEFAULT_THRESHOLDS.apiWarningMs;

 if (duration > threshold) {
 // Write to stdout structured logs so Datadog or similar can pick it up
 console.warn(
 JSON.stringify({
 level: 'warn',
 event: 'slow_operation',
 operationName,
 type,
 durationMs: Math.round(duration),
 thresholdMs: threshold,
 timestamp: new Date().toISOString(),
 })
 );
 }
 }
}
