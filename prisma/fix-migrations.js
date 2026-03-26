/**
 * Fix Prisma Migrations on Production (Supabase)
 * Usage: node prisma/fix-migrations.js
 * 
 * Resolves failed/pending migrations that were already applied via `prisma db push`
 * but not recorded in the `_prisma_migrations` table.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// --- Resolve Production DB URL (same logic as sync-to-supabase.js) ---
let supabaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DIRECT_URL_PRODUCTION;

if (!supabaseUrl) {
  try {
    const envProd = fs.readFileSync(path.join(process.cwd(), '.env.production'), 'utf-8');
    const match = envProd.match(/DIRECT_URL="([^"]+)"/);
    if (match) supabaseUrl = match[1];
    if (!supabaseUrl) {
      const match2 = envProd.match(/DATABASE_URL="([^"]+)"/);
      if (match2) supabaseUrl = match2[1];
    }
  } catch (e) {}
}

if (!supabaseUrl) {
  console.error('❌ Cannot find Supabase DATABASE_URL.');
  console.error('   Set SUPABASE_DATABASE_URL env var or add DIRECT_URL to .env.production');
  process.exit(1);
}

console.log(`📡 Production DB: ${supabaseUrl.replace(/:[^:@]+@/, ':***@')}\n`);

// Helper: run prisma command with production URL
function prisma(cmd) {
  try {
    const result = execSync(`npx prisma ${cmd}`, {
      env: { ...process.env, DATABASE_URL: supabaseUrl },
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, output: result };
  } catch (e) {
    return { success: false, output: e.stdout || '', error: e.stderr || e.message };
  }
}

async function main() {
  // Step 1: Check migration status
  console.log('📋 Checking migration status...\n');
  const status = prisma('migrate status');
  console.log(status.output || status.error);

  // Step 2: Find failed migrations from status output
  const fullOutput = (status.output || '') + (status.error || '');
  const failedMatch = fullOutput.match(/Following migration.+failed.+\n(.+)/i);
  const pendingMatches = [...fullOutput.matchAll(/(\d{14}_\w+)/g)].map(m => m[1]);

  // Detect if there are issues
  const hasIssues = fullOutput.includes('failed') || fullOutput.includes('not yet been applied') || !status.success;

  if (!hasIssues) {
    console.log('✅ All migrations are up to date! No action needed.');
    return;
  }

  // Step 3: Get all local migration folder names
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
  const allMigrations = fs.readdirSync(migrationsDir)
    .filter(f => f.match(/^\d{14}_/))
    .sort();

  console.log(`\n📂 Found ${allMigrations.length} local migrations`);
  console.log('─'.repeat(50));

  // Step 4: Resolve each migration
  let resolved = 0;
  let skipped = 0;
  let errors = 0;

  for (const migration of allMigrations) {
    process.stdout.write(`   🔧 Resolving: ${migration}... `);
    const result = prisma(`migrate resolve --applied ${migration}`);
    
    if (result.success) {
      console.log('✅ marked as applied');
      resolved++;
    } else if ((result.error || '').includes('P3008') || (result.error || '').includes('already been applied')) {
      console.log('⏭️  already applied');
      skipped++;
    } else if ((result.error || '').includes('failed')) {
      // Migration is in failed state — need to rollback first, then re-apply
      process.stdout.write('(failed state → rollback + re-apply) ');
      const rollback = prisma(`migrate resolve --rolled-back ${migration}`);
      if (rollback.success) {
        const reapply = prisma(`migrate resolve --applied ${migration}`);
        if (reapply.success) {
          console.log('✅ fixed');
          resolved++;
        } else {
          console.log(`❌ re-apply failed`);
          errors++;
        }
      } else {
        console.log(`❌ rollback failed`);
        errors++;
      }
    } else {
      console.log(`❌ ${(result.error || '').split('\n').find(l => l.trim()) || 'unknown error'}`);
      errors++;
    }
  }

  console.log('─'.repeat(50));
  console.log(`\n📊 Results: ${resolved} resolved, ${skipped} skipped, ${errors} errors`);

  // Step 5: Verify final status
  console.log('\n🔍 Verifying final status...\n');
  const finalStatus = prisma('migrate status');
  console.log(finalStatus.output || finalStatus.error);

  if (errors === 0) {
    console.log('✨ Done! You can now redeploy on Vercel.');
  } else {
    console.log('⚠️  Some migrations failed to resolve. Check errors above.');
  }
}

main().catch(e => console.error('❌ Error:', e.message));
