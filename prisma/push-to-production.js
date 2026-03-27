/**
 * Push schema to Supabase production
 * Usage: node prisma/push-to-production.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read .env.production
const envProd = fs.readFileSync(path.join(process.cwd(), '.env.production'), 'utf-8');

const dbMatch = envProd.match(/DATABASE_URL="([^"]+)"/);
const directMatch = envProd.match(/DIRECT_URL="([^"]+)"/);

const DATABASE_URL = dbMatch ? dbMatch[1] : null;
const DIRECT_URL = directMatch ? directMatch[1] : null;

if (!DATABASE_URL && !DIRECT_URL) {
  console.error('❌ No DATABASE_URL or DIRECT_URL found in .env.production');
  process.exit(1);
}

const url = DIRECT_URL || DATABASE_URL;
console.log(`📡 Pushing schema to: ${url.replace(/:[^:@]+@/, ':***@')}\n`);

try {
  execSync('npx prisma db push --accept-data-loss', {
    env: {
      ...process.env,
      DATABASE_URL: url,
      DIRECT_URL: url,
    },
    encoding: 'utf-8',
    stdio: 'inherit',
  });
  console.log('\n✅ Schema pushed successfully!');
} catch (e) {
  console.error('\n❌ Push failed:', e.message);
  process.exit(1);
}
