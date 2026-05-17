/**
 * This script is used to measure the TTFB (Time to First Byte) of key public pages.
 * Run this locally or against production to benchmark speed changes.
 * 
 * Usage: npx tsx scripts/measure-page-speed.ts
 */
import fs from 'fs';

const TARGET_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const ROUTES_TO_TEST = [
  '/',
  '/academy',
  '/tools',
  '/brokers',
  '/knowledge',
  '/auth/login',
];

async function measureRoute(route: string) {
  const url = `${TARGET_URL}${route}`;
  const start = performance.now();
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' } // Force fresh fetch for measurement
    });
    
    // Read the body fully to measure full download time
    await response.text(); 
    
    const end = performance.now();
    const durationMs = Math.round(end - start);
    
    return {
      route,
      status: response.status,
      durationMs,
      cacheHeader: response.headers.get('x-nextjs-cache') || 'UNKNOWN',
    };
  } catch (err: any) {
    return {
      route,
      status: 500,
      error: err.message,
    };
  }
}

async function run() {
  console.log(`Starting performance benchmark against: ${TARGET_URL}\n`);
  
  const results = [];
  
  for (const route of ROUTES_TO_TEST) {
    console.log(`Testing ${route}...`);
    const result = await measureRoute(route);
    results.push(result);
  }
  
  console.log('\n--- Results ---');
  console.table(results);
  
  // Save to JSON
  fs.writeFileSync('performance-page-baseline.json', JSON.stringify(results, null, 2));
  console.log('\nSaved results to performance-page-baseline.json');
}

run();
