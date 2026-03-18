/**
 * Sync Academy data from Local DB → Supabase DB
 * Usage: node prisma/sync-to-supabase.js
 * 
 * Reads Level, Module, Lesson from local PostgreSQL
 * and upserts them into Supabase PostgreSQL
 */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

// Local DB (from .env.local)
const localPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

// Supabase DB (direct URL for writes)
const SUPABASE_URL = process.env.SUPABASE_DATABASE_URL || process.env.DIRECT_URL_PRODUCTION;
// Fallback: read from .env.production
const fs = require('fs');
const path = require('path');
let supabaseUrl = SUPABASE_URL;
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
  console.error('❌ Cannot find Supabase DATABASE_URL. Set SUPABASE_DATABASE_URL env var or check .env.production');
  process.exit(1);
}

console.log(`📡 Supabase URL: ${supabaseUrl.replace(/:[^:@]+@/, ':***@')}`);

const remotePrisma = new PrismaClient({
  datasources: { db: { url: supabaseUrl } },
});

async function main() {
  console.log('🔄 Syncing Academy data: Local → Supabase\n');

  // 1. Read all data from local
  console.log('📖 Reading from local DB...');
  const levels = await localPrisma.level.findMany({ orderBy: { order: 'asc' } });
  const modules = await localPrisma.module.findMany({ orderBy: { order: 'asc' } });
  const lessons = await localPrisma.lesson.findMany({ orderBy: { order: 'asc' } });

  console.log(`   Found: ${levels.length} levels, ${modules.length} modules, ${lessons.length} lessons\n`);

  // 2. Sync Levels
  console.log('📚 Syncing Levels...');
  for (const level of levels) {
    await remotePrisma.level.upsert({
      where: { id: level.id },
      create: level,
      update: { title: level.title, description: level.description, order: level.order },
    });
    console.log(`   ✅ Level ${level.order}: ${level.title}`);
  }

  // 3. Sync Modules
  console.log('\n📂 Syncing Modules...');
  for (const mod of modules) {
    await remotePrisma.module.upsert({
      where: { id: mod.id },
      create: mod,
      update: { title: mod.title, description: mod.description, order: mod.order, levelId: mod.levelId },
    });
    console.log(`   ✅ ${mod.title}`);
  }

  // 4. Sync Lessons
  console.log(`\n📝 Syncing ${lessons.length} Lessons...`);
  let synced = 0;
  for (const lesson of lessons) {
    await remotePrisma.lesson.upsert({
      where: { id: lesson.id },
      create: lesson,
      update: {
        title: lesson.title,
        slug: lesson.slug,
        content: lesson.content,
        status: lesson.status,
        moduleId: lesson.moduleId,
        order: lesson.order,
      },
    });
    synced++;
    if (synced % 10 === 0) console.log(`   ✅ ${synced}/${lessons.length} lessons synced...`);
  }

  console.log(`   ✅ ${synced}/${lessons.length} lessons synced!`);
  console.log(`\n${'='.repeat(50)}\n✨ Done! All Academy data synced to Supabase.`);
}

main()
  .catch(e => console.error('❌ Error:', e.message))
  .finally(async () => {
    await localPrisma.$disconnect();
    await remotePrisma.$disconnect();
  });
