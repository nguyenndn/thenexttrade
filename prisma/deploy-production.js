/**
 * Deploy pending migration to Production (Supabase)
 * Usage: node prisma/deploy-production.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Resolve Production DB URL
let supabaseUrl = process.env.SUPABASE_DATABASE_URL;
let supabaseDirectUrl = null;

if (!supabaseUrl) {
  try {
    const envProd = fs.readFileSync(path.join(process.cwd(), '.env.production'), 'utf-8');
    const directMatch = envProd.match(/DIRECT_URL="([^"]+)"/);
    if (directMatch) supabaseDirectUrl = directMatch[1];
    const dbMatch = envProd.match(/DATABASE_URL="([^"]+)"/);
    if (dbMatch) supabaseUrl = dbMatch[1];
    if (!supabaseUrl) supabaseUrl = supabaseDirectUrl;
    if (supabaseDirectUrl) supabaseUrl = supabaseDirectUrl;
  } catch (e) {}
}

if (!supabaseUrl) {
  console.error('❌ Cannot find Supabase DATABASE_URL.');
  process.exit(1);
}

console.log(`📡 Production DB: ${supabaseUrl.replace(/:[^:@]+@/, ':***@')}\n`);

// First: rollback the "marked as applied" so we can actually deploy
console.log('🔄 Rolling back mark-as-applied for new migration...\n');
try {
  execSync('npx prisma migrate resolve --rolled-back 20260402231541_sync_academy_and_profile', {
    env: { ...process.env, DATABASE_URL: supabaseUrl, DIRECT_URL: supabaseDirectUrl || supabaseUrl },
    encoding: 'utf-8',
    stdio: 'inherit',
  });
} catch (e) {
  console.log('  (already rolled back or not marked)\n');
}

// Deploy to production
console.log('\n🚀 Deploying migration to production...\n');
try {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: supabaseUrl, DIRECT_URL: supabaseDirectUrl || supabaseUrl },
    encoding: 'utf-8',
    stdio: 'inherit',
  });
  console.log('\n✅ Production migration deployed successfully!');
} catch (e) {
  console.error('\n❌ Deploy failed:', e.message);
  process.exit(1);
}
