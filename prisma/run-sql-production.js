/**
 * Run raw SQL migration on Production (Supabase)
 * Uses Prisma client to avoid needing `pg` dependency
 * Usage: node prisma/run-sql-production.js
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Resolve Production DB URL
let dbUrl = null;
let directUrl = null;
try {
  const envProd = fs.readFileSync(path.join(process.cwd(), '.env.production'), 'utf-8');
  const directMatch = envProd.match(/DIRECT_URL="([^"]+)"/);
  if (directMatch) directUrl = directMatch[1];
  const dbMatch = envProd.match(/DATABASE_URL="([^"]+)"/);
  if (dbMatch) dbUrl = dbMatch[1];
  if (!dbUrl) dbUrl = directUrl;
} catch (e) {}

if (!dbUrl) {
  dbUrl = process.env.SUPABASE_DATABASE_URL;
}

if (!dbUrl) {
  console.error('❌ Cannot find production DB URL');
  process.exit(1);
}

console.log(`📡 Production DB: ${dbUrl.replace(/:[^:@]+@/, ':***@')}\n`);

const prisma = new PrismaClient({
  datasources: {
    db: { url: directUrl || dbUrl }
  }
});

async function main() {
  const sql = fs.readFileSync(
    path.join(__dirname, 'migrations', '20260403063000_add_copy_trading_registration', 'migration.sql'),
    'utf-8'
  );

  // Split by statement (handle DO $$ blocks)
  const statements = [];
  let current = '';
  const lines = sql.split('\n');
  let inDoBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') || trimmed === '') {
      current += line + '\n';
      continue;
    }

    if (trimmed.startsWith('DO $$') || trimmed.startsWith('DO $')) {
      inDoBlock = true;
    }

    current += line + '\n';

    if (inDoBlock && (trimmed === '$$;' || trimmed.endsWith('$$;'))) {
      inDoBlock = false;
      statements.push(current.trim());
      current = '';
    } else if (!inDoBlock && trimmed.endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) statements.push(current.trim());

  // Filter out empty/comment-only statements
  const validStatements = statements.filter(s => {
    const cleaned = s.split('\n').filter(l => !l.trim().startsWith('--') && l.trim() !== '').join('');
    return cleaned.length > 0;
  });

  console.log(`🚀 Running ${validStatements.length} SQL statements on production...\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < validStatements.length; i++) {
    const stmt = validStatements[i];
    const preview = stmt.split('\n').find(l => !l.trim().startsWith('--') && l.trim()) || stmt;
    process.stdout.write(`  [${i + 1}/${validStatements.length}] ${preview.substring(0, 70)}... `);
    
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log('✅');
      success++;
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('does not exist') || err.message.includes('duplicate')) {
        console.log('⏭️  (already done)');
        success++;
      } else {
        console.log(`❌ ${err.message.split('\n')[0]}`);
        failed++;
      }
    }
  }

  console.log(`\n📊 Results: ${success} succeeded, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All migration SQL executed successfully on production!');
  } else {
    console.log('⚠️  Some statements failed. Review errors above.');
  }
}

main()
  .catch(e => console.error('❌ Error:', e.message))
  .finally(() => prisma.$disconnect());
