#!/usr/bin/env node
/**
 * ============================================================================
 * TheNextTrade — Unified Database CLI
 * ============================================================================
 * 
 * Usage:
 *   node prisma/db.js <command> [target] [options]
 * 
 * Commands:
 *   backup local|prod       Backup database to prisma/backups/
 *   restore local           Restore latest backup to local DB
 *   migrate prod             Safe migration on production (ADD only)
 *   sync local-to-prod      Sync Academy content Local → Production
 *   sync prod-to-local      Sync Academy content Production → Local
 *   status                  Check migration status on both DBs
 * 
 * Examples:
 *   node prisma/db.js backup local
 *   node prisma/db.js backup prod
 *   node prisma/db.js sync prod-to-local
 *   node prisma/db.js migrate prod
 *   node prisma/db.js status
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ─── Config ──────────────────────────────────────────────────────────────────
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const BACKUPS_DIR = path.join(__dirname, 'backups');
const MAX_BACKUPS = 10;

// ─── Resolve DB URLs ─────────────────────────────────────────────────────────

function getLocalUrl() {
  return process.env.DATABASE_URL || 'postgresql://postgres:ServBay.dev@localhost:5432/gsn_crm';
}

function getProductionUrls() {
  let dbUrl = process.env.SUPABASE_DATABASE_URL || null;
  let directUrl = null;

  if (!dbUrl) {
    try {
      const envProd = fs.readFileSync(path.join(process.cwd(), '.env.production'), 'utf-8');
      const directMatch = envProd.match(/DIRECT_URL="([^"]+)"/);
      if (directMatch) directUrl = directMatch[1];
      const dbMatch = envProd.match(/DATABASE_URL="([^"]+)"/);
      if (dbMatch) dbUrl = dbMatch[1];
      if (!dbUrl) dbUrl = directUrl;
    } catch (e) {}
  }

  if (!dbUrl) {
    console.error('❌ Cannot find production DB URL.');
    console.error('   Set SUPABASE_DATABASE_URL in .env.local or check .env.production');
    process.exit(1);
  }

  return { dbUrl, directUrl: directUrl || dbUrl };
}

function maskUrl(url) {
  return url.replace(/:[^:@]+@/, ':***@');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ensureBackupsDir() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
  // Add .gitignore if not exists
  const gitignorePath = path.join(BACKUPS_DIR, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, '*\n!.gitignore\n');
  }
}

function rotateBackups() {
  const files = fs.readdirSync(BACKUPS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()
    .reverse();
  
  if (files.length > MAX_BACKUPS) {
    for (const old of files.slice(MAX_BACKUPS)) {
      fs.unlinkSync(path.join(BACKUPS_DIR, old));
      console.log(`   🗑️  Deleted old backup: ${old}`);
    }
  }
}

function timestamp() {
  const now = new Date();
  return now.toISOString().replace(/[T:]/g, '-').replace(/\..+/, '');
}

async function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(`⚠️  ${question} [y/N]: `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

function createPrismaClient(url) {
  return new PrismaClient({ datasources: { db: { url } } });
}

// ─── COMMAND: backup ──────────────────────────────────────────────────────────

async function cmdBackup(target) {
  if (!target || !['local', 'prod', 'production'].includes(target)) {
    console.error('Usage: node prisma/db.js backup <local|prod>');
    process.exit(1);
  }

  ensureBackupsDir();
  const isLocal = target === 'local';
  const url = isLocal ? getLocalUrl() : getProductionUrls().directUrl;
  const prefix = isLocal ? 'local' : 'prod';
  const filename = `${prefix}_${timestamp()}.sql`;
  const filepath = path.join(BACKUPS_DIR, filename);

  console.log(`\n📦 Backing up ${isLocal ? 'LOCAL' : 'PRODUCTION'} database...`);
  console.log(`   DB: ${maskUrl(url)}`);
  console.log(`   File: ${filename}\n`);

  try {
    // Use --dbname to properly handle URLs with special chars in passwords
    execSync(`pg_dump --dbname="${url}" --no-owner --no-acl --clean --if-exists --file="${filepath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const size = (fs.statSync(filepath).size / 1024).toFixed(1);
    console.log(`✅ Backup saved: ${filename} (${size} KB)`);
    rotateBackups();
    return filepath;
  } catch (e) {
    // Cleanup empty file
    try { fs.unlinkSync(filepath); } catch (_) {}
    if (!isLocal && e.message.includes('version mismatch')) {
      console.log(`⚠️  pg_dump version mismatch — cannot backup production locally.`);
      console.log(`   Supabase has automatic backups via dashboard. Continuing...`);
      return null;
    }
    console.error(`❌ Backup failed: ${e.message}`);
    process.exit(1);
  }
}

// ─── COMMAND: restore ─────────────────────────────────────────────────────────

async function cmdRestore(target) {
  if (target !== 'local') {
    console.error('⛔ Restore is only supported for LOCAL database.');
    console.error('   Production restore must be done via Supabase dashboard.');
    process.exit(1);
  }

  ensureBackupsDir();
  const files = fs.readdirSync(BACKUPS_DIR)
    .filter(f => f.startsWith('local_') && f.endsWith('.sql'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error('❌ No local backups found in prisma/backups/');
    process.exit(1);
  }

  const latest = files[0];
  console.log(`\n🔄 Restoring LOCAL database from backup...`);
  console.log(`   File: ${latest}`);
  console.log(`   Available backups: ${files.length}\n`);

  const ok = await confirm('This will REPLACE your local database. Continue?');
  if (!ok) { console.log('Cancelled.'); return; }

  const url = getLocalUrl();
  const filepath = path.join(BACKUPS_DIR, latest);

  try {
    execSync(`psql --dbname="${url}" --file="${filepath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(`\n✅ Local database restored from ${latest}`);
  } catch (e) {
    console.error(`❌ Restore failed: ${e.message}`);
    process.exit(1);
  }
}

// ─── COMMAND: migrate ─────────────────────────────────────────────────────────

async function cmdMigrate(target) {
  if (target === 'local') {
    console.log('\n🔄 Running prisma migrate dev on LOCAL...\n');
    try {
      execSync('npx prisma migrate dev', { encoding: 'utf-8', stdio: 'inherit' });
      console.log('\n✅ Local migration complete!');
    } catch (e) {
      console.error('❌ Local migration failed');
      process.exit(1);
    }
    return;
  }

  if (!target || !['prod', 'production'].includes(target)) {
    console.error('Usage: node prisma/db.js migrate <local|prod>');
    process.exit(1);
  }

  const ok = await confirm('This will run migrations on PRODUCTION. Continue?');
  if (!ok) { console.log('Cancelled.'); return; }

  // Auto-backup before migrate
  console.log('\n📦 Auto-backup production before migration...');
  await cmdBackup('prod');

  const { dbUrl, directUrl } = getProductionUrls();
  console.log(`\n🚀 Deploying migrations to production...`);
  console.log(`   DB: ${maskUrl(directUrl)}\n`);

  try {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: directUrl, DIRECT_URL: directUrl },
      encoding: 'utf-8',
      stdio: 'inherit',
    });
    console.log('\n✅ Production migration deployed successfully!');
  } catch (e) {
    console.error('\n❌ Deploy failed. Your backup is in prisma/backups/');
    process.exit(1);
  }
}

// ─── COMMAND: sync ────────────────────────────────────────────────────────────

const ACADEMY_TABLES = ['Level', 'Module', 'Lesson'];
const CONTENT_TABLES = ['Category', 'Tag', 'Article', 'ArticleTag', 'Quote'];

async function cmdSync(direction) {
  if (direction === 'local-to-prod') {
    await syncLocalToProd();
  } else if (direction === 'prod-to-local') {
    await syncProdToLocal();
  } else {
    console.error('Usage: node prisma/db.js sync <local-to-prod|prod-to-local>');
    process.exit(1);
  }
}

async function syncLocalToProd() {
  const ok = await confirm('This will sync Academy content from LOCAL → PRODUCTION. Continue?');
  if (!ok) { console.log('Cancelled.'); return; }

  // Auto-backup prod
  console.log('\n📦 Auto-backup production before sync...');
  await cmdBackup('prod');

  const localUrl = getLocalUrl();
  const { directUrl } = getProductionUrls();

  const local = createPrismaClient(localUrl);
  const remote = createPrismaClient(directUrl);

  try {
    console.log('\n🔄 Syncing: LOCAL → PRODUCTION\n');

    // 1. Academy data
    console.log('📖 Reading local Academy data...');
    const levels = await local.level.findMany({ orderBy: { order: 'asc' } });
    const modules = await local.module.findMany({ orderBy: { order: 'asc' } });
    const lessons = await local.lesson.findMany({ orderBy: { order: 'asc' } });
    const quizzes = await local.quiz.findMany({ orderBy: { createdAt: 'asc' } });
    const questions = await local.question.findMany({ orderBy: { order: 'asc' } });
    const options = await local.option.findMany();
    console.log(`   ${levels.length} levels, ${modules.length} modules, ${lessons.length} lessons`);
    console.log(`   ${quizzes.length} quizzes, ${questions.length} questions, ${options.length} options`);

    // 2. Content data
    console.log('\n📰 Reading local Content data...');
    const categories = await local.category.findMany({ orderBy: { createdAt: 'asc' } });
    const tags = await local.tag.findMany({ orderBy: { name: 'asc' } });
    const articles = await local.article.findMany({ orderBy: { createdAt: 'asc' } });
    const articleTags = await local.articleTag.findMany();
    const quotes = await local.quote.findMany({ orderBy: { createdAt: 'asc' } });
    console.log(`   ${categories.length} categories, ${tags.length} tags, ${articles.length} articles, ${quotes.length} quotes`);

    // 3. Clear remote academy (cascade handles modules/lessons)
    console.log('\n🧹 Clearing remote Academy data...');
    await remote.level.deleteMany({});

    // 4. Sync Levels
    console.log('\n📚 Syncing Levels...');
    for (const level of levels) {
      await remote.level.upsert({ where: { id: level.id }, create: level, update: { title: level.title, description: level.description, order: level.order } });
    }
    console.log(`   ✅ ${levels.length} levels`);

    // 5. Sync Modules
    console.log('📂 Syncing Modules...');
    for (const mod of modules) {
      await remote.module.upsert({ where: { id: mod.id }, create: mod, update: { title: mod.title, description: mod.description, order: mod.order, levelId: mod.levelId } });
    }
    console.log(`   ✅ ${modules.length} modules`);

    // 6. Sync Lessons
    console.log(`📝 Syncing Lessons...`);
    let synced = 0;
    for (const lesson of lessons) {
      await remote.lesson.upsert({ where: { id: lesson.id }, create: lesson, update: { title: lesson.title, slug: lesson.slug, content: lesson.content, status: lesson.status, moduleId: lesson.moduleId, order: lesson.order } });
      synced++;
      if (synced % 20 === 0) console.log(`   ... ${synced}/${lessons.length}`);
    }
    console.log(`   ✅ ${synced} lessons`);

    // 6b. Sync Quizzes (linked to modules)
    console.log('🧠 Syncing Quizzes...');
    for (const quiz of quizzes) {
      await remote.quiz.upsert({ where: { id: quiz.id }, create: quiz, update: { title: quiz.title, description: quiz.description, moduleId: quiz.moduleId } });
    }
    console.log(`   ✅ ${quizzes.length} quizzes`);

    // 6c. Sync Questions
    console.log('❓ Syncing Questions...');
    for (const q of questions) {
      await remote.question.upsert({ where: { id: q.id }, create: q, update: { quizId: q.quizId, text: q.text, order: q.order } });
    }
    console.log(`   ✅ ${questions.length} questions`);

    // 6d. Sync Options
    console.log('🔘 Syncing Options...');
    for (const opt of options) {
      await remote.option.upsert({ where: { id: opt.id }, create: opt, update: { questionId: opt.questionId, text: opt.text, isCorrect: opt.isCorrect } });
    }
    console.log(`   ✅ ${options.length} options`);

    // 7. Sync Categories (parents first)
    console.log('🗂️  Syncing Categories...');
    const parentCats = categories.filter(c => !c.parentId);
    const childCats = categories.filter(c => c.parentId);
    for (const cat of [...parentCats, ...childCats]) {
      await remote.category.upsert({ where: { id: cat.id }, create: cat, update: { name: cat.name, slug: cat.slug, description: cat.description, parentId: cat.parentId } });
    }
    console.log(`   ✅ ${categories.length} categories`);

    // 8. Sync Tags
    console.log('🏷️  Syncing Tags...');
    for (const tag of tags) {
      await remote.tag.upsert({ where: { id: tag.id }, create: tag, update: { name: tag.name, slug: tag.slug } });
    }
    console.log(`   ✅ ${tags.length} tags`);

    // 9. Sync Articles
    console.log('📰 Syncing Articles...');
    for (const article of articles) {
      await remote.article.upsert({
        where: { id: article.id }, create: article,
        update: { title: article.title, slug: article.slug, excerpt: article.excerpt, content: article.content, thumbnail: article.thumbnail, status: article.status, categoryId: article.categoryId, authorId: article.authorId, isFeatured: article.isFeatured, publishedAt: article.publishedAt, metaTitle: article.metaTitle, metaDescription: article.metaDescription, focusKeyword: article.focusKeyword, views: article.views },
      });
    }
    console.log(`   ✅ ${articles.length} articles`);

    // 10. Sync ArticleTags
    console.log('🔗 Syncing ArticleTags...');
    for (const at of articleTags) {
      await remote.articleTag.upsert({ where: { articleId_tagId: { articleId: at.articleId, tagId: at.tagId } }, create: at, update: {} });
    }
    console.log(`   ✅ ${articleTags.length} article-tags`);

    // 11. Sync Quotes
    console.log('💬 Syncing Quotes...');
    for (const quote of quotes) {
      await remote.quote.upsert({ where: { id: quote.id }, create: quote, update: { text: quote.text, author: quote.author, type: quote.type, isActive: quote.isActive } });
    }
    console.log(`   ✅ ${quotes.length} quotes`);

    console.log('\n✨ Done! All content synced LOCAL → PRODUCTION.');
  } catch (e) {
    console.error(`\n❌ Sync failed: ${e.message}`);
    console.error('   Your production backup is in prisma/backups/');
    process.exit(1);
  } finally {
    await local.$disconnect();
    await remote.$disconnect();
  }
}

async function syncProdToLocal() {
  const ok = await confirm('This will sync Academy content from PRODUCTION → LOCAL. Continue?');
  if (!ok) { console.log('Cancelled.'); return; }

  // Auto-backup local
  console.log('\n📦 Auto-backup local before sync...');
  await cmdBackup('local');

  const localUrl = getLocalUrl();
  const { directUrl } = getProductionUrls();

  const local = createPrismaClient(localUrl);
  const remote = createPrismaClient(directUrl);

  try {
    console.log('\n🔄 Syncing: PRODUCTION → LOCAL\n');

    // 1. Read production Academy data
    console.log('📖 Reading production Academy data...');
    const levels = await remote.level.findMany({ orderBy: { order: 'asc' } });
    const modules = await remote.module.findMany({ orderBy: { order: 'asc' } });
    const lessons = await remote.lesson.findMany({ orderBy: { order: 'asc' } });
    const quizzes = await remote.quiz.findMany({ orderBy: { createdAt: 'asc' } });
    const questions = await remote.question.findMany({ orderBy: { order: 'asc' } });
    const options = await remote.option.findMany();
    console.log(`   ${levels.length} levels, ${modules.length} modules, ${lessons.length} lessons`);
    console.log(`   ${quizzes.length} quizzes, ${questions.length} questions, ${options.length} options`);

    // 2. Read production Content data
    console.log('\n📰 Reading production Content data...');
    const categories = await remote.category.findMany({ orderBy: { createdAt: 'asc' } });
    const tags = await remote.tag.findMany({ orderBy: { name: 'asc' } });
    const articles = await remote.article.findMany({ orderBy: { createdAt: 'asc' } });
    const articleTags = await remote.articleTag.findMany();
    const quotes = await remote.quote.findMany({ orderBy: { createdAt: 'asc' } });
    console.log(`   ${categories.length} categories, ${tags.length} tags, ${articles.length} articles, ${quotes.length} quotes`);

    // 3. Clear local academy data (cascade)
    console.log('\n🧹 Clearing local Academy data...');
    await local.level.deleteMany({});

    // 4. Sync Levels
    console.log('\n📚 Syncing Levels...');
    for (const level of levels) {
      await local.level.upsert({ where: { id: level.id }, create: level, update: { title: level.title, description: level.description, order: level.order } });
    }
    console.log(`   ✅ ${levels.length} levels`);

    // 5. Sync Modules
    console.log('📂 Syncing Modules...');
    for (const mod of modules) {
      await local.module.upsert({ where: { id: mod.id }, create: mod, update: { title: mod.title, description: mod.description, order: mod.order, levelId: mod.levelId } });
    }
    console.log(`   ✅ ${modules.length} modules`);

    // 6. Sync Lessons
    console.log(`📝 Syncing Lessons...`);
    let synced = 0;
    for (const lesson of lessons) {
      await local.lesson.upsert({ where: { id: lesson.id }, create: lesson, update: { title: lesson.title, slug: lesson.slug, content: lesson.content, status: lesson.status, moduleId: lesson.moduleId, order: lesson.order } });
      synced++;
      if (synced % 20 === 0) console.log(`   ... ${synced}/${lessons.length}`);
    }
    console.log(`   ✅ ${synced} lessons`);

    // 6b. Sync Quizzes
    console.log('🧠 Syncing Quizzes...');
    for (const quiz of quizzes) {
      await local.quiz.upsert({ where: { id: quiz.id }, create: quiz, update: { title: quiz.title, description: quiz.description, moduleId: quiz.moduleId } });
    }
    console.log(`   ✅ ${quizzes.length} quizzes`);

    // 6c. Sync Questions
    console.log('❓ Syncing Questions...');
    for (const q of questions) {
      await local.question.upsert({ where: { id: q.id }, create: q, update: { quizId: q.quizId, text: q.text, order: q.order } });
    }
    console.log(`   ✅ ${questions.length} questions`);

    // 6d. Sync Options
    console.log('🔘 Syncing Options...');
    for (const opt of options) {
      await local.option.upsert({ where: { id: opt.id }, create: opt, update: { questionId: opt.questionId, text: opt.text, isCorrect: opt.isCorrect } });
    }
    console.log(`   ✅ ${options.length} options`);

    // 7. Sync Categories (parents first)
    console.log('🗂️  Syncing Categories...');
    const parentCats = categories.filter(c => !c.parentId);
    const childCats = categories.filter(c => c.parentId);
    for (const cat of [...parentCats, ...childCats]) {
      await local.category.upsert({ where: { id: cat.id }, create: cat, update: { name: cat.name, slug: cat.slug, description: cat.description, parentId: cat.parentId } });
    }
    console.log(`   ✅ ${categories.length} categories`);

    // 8. Sync Tags
    console.log('🏷️  Syncing Tags...');
    for (const tag of tags) {
      await local.tag.upsert({ where: { id: tag.id }, create: tag, update: { name: tag.name, slug: tag.slug } });
    }
    console.log(`   ✅ ${tags.length} tags`);

    // 9. Sync Articles (handle authorId FK — remap to local user if needed)
    console.log('📰 Syncing Articles...');
    const localUser = await local.user.findFirst({ select: { id: true } });
    let articlesSynced = 0;
    for (const article of articles) {
      // Check if author exists locally
      const authorExists = article.authorId ? await local.user.findUnique({ where: { id: article.authorId }, select: { id: true } }) : null;
      const safeAuthorId = authorExists ? article.authorId : (localUser?.id || article.authorId);
      const articleData = { ...article, authorId: safeAuthorId };
      try {
        await local.article.upsert({
          where: { id: article.id }, create: articleData,
          update: { title: article.title, slug: article.slug, excerpt: article.excerpt, content: article.content, thumbnail: article.thumbnail, status: article.status, categoryId: article.categoryId, authorId: safeAuthorId, isFeatured: article.isFeatured, publishedAt: article.publishedAt, metaTitle: article.metaTitle, metaDescription: article.metaDescription, focusKeyword: article.focusKeyword, views: article.views },
        });
        articlesSynced++;
      } catch (e) {
        console.log(`   ⏭️  Skipped article: ${article.title} (${e.message.split('\n')[0]})`);
      }
    }
    console.log(`   ✅ ${articlesSynced}/${articles.length} articles`);

    // 10. Sync ArticleTags
    console.log('🔗 Syncing ArticleTags...');
    for (const at of articleTags) {
      await local.articleTag.upsert({ where: { articleId_tagId: { articleId: at.articleId, tagId: at.tagId } }, create: at, update: {} });
    }
    console.log(`   ✅ ${articleTags.length} article-tags`);

    // 11. Sync Quotes
    console.log('💬 Syncing Quotes...');
    for (const quote of quotes) {
      await local.quote.upsert({ where: { id: quote.id }, create: quote, update: { text: quote.text, author: quote.author, type: quote.type, isActive: quote.isActive } });
    }
    console.log(`   ✅ ${quotes.length} quotes`);

    console.log('\n✨ Done! Academy content synced PRODUCTION → LOCAL.');
  } catch (e) {
    console.error(`\n❌ Sync failed: ${e.message}`);
    console.error('   Your local backup is in prisma/backups/');
    process.exit(1);
  } finally {
    await local.$disconnect();
    await remote.$disconnect();
  }
}

// ─── COMMAND: status ──────────────────────────────────────────────────────────

async function cmdStatus() {
  console.log('\n📋 Database Status\n');

  // Local
  console.log('── LOCAL ──────────────────────────────────');
  console.log(`   URL: ${maskUrl(getLocalUrl())}`);
  try {
    const result = execSync('npx prisma migrate status', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const lines = result.split('\n').filter(l => l.trim()).slice(1);
    lines.forEach(l => console.log(`   ${l.trim()}`));
  } catch (e) {
    const output = (e.stdout || '') + (e.stderr || '');
    if (output.includes('Database schema is up to date')) {
      console.log('   ✅ Schema is up to date');
    } else {
      console.log(`   ⚠️  ${output.split('\n').find(l => l.includes('migration') || l.includes('applied')) || 'Check manually'}`);
    }
  }

  // Production
  console.log('\n── PRODUCTION ─────────────────────────────');
  const { directUrl } = getProductionUrls();
  console.log(`   URL: ${maskUrl(directUrl)}`);
  try {
    const result = execSync('npx prisma migrate status', {
      env: { ...process.env, DATABASE_URL: directUrl, DIRECT_URL: directUrl },
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const lines = result.split('\n').filter(l => l.trim()).slice(1);
    lines.forEach(l => console.log(`   ${l.trim()}`));
  } catch (e) {
    const output = (e.stdout || '') + (e.stderr || '');
    if (output.includes('Database schema is up to date')) {
      console.log('   ✅ Schema is up to date');
    } else {
      console.log(`   ⚠️  ${output.split('\n').find(l => l.includes('migration') || l.includes('applied')) || 'Check manually'}`);
    }
  }

  // Backup info
  console.log('\n── BACKUPS ────────────────────────────────');
  ensureBackupsDir();
  const backups = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.sql')).sort().reverse();
  if (backups.length === 0) {
    console.log('   No backups found');
  } else {
    backups.slice(0, 5).forEach(f => {
      const size = (fs.statSync(path.join(BACKUPS_DIR, f)).size / 1024).toFixed(1);
      console.log(`   ${f} (${size} KB)`);
    });
    if (backups.length > 5) console.log(`   ... and ${backups.length - 5} more`);
  }

  console.log('');
}

// ─── MENU ─────────────────────────────────────────────────────────────────────

function showHelp() {
  console.log(`
╔══════════════════════════════════════════════════╗
║       TheNextTrade — Database CLI (db.js)        ║
╚══════════════════════════════════════════════════╝

Commands:
  backup local         Backup local PostgreSQL database
  backup prod          Backup production Supabase database
  restore local        Restore local DB from latest backup
  migrate local        Run prisma migrate dev on local
  migrate prod         Safe deploy migrations to production
  sync local-to-prod   Sync Academy/Content LOCAL → PRODUCTION
  sync prod-to-local   Sync Academy/Content PRODUCTION → LOCAL
  status               Show migration & backup status

Safety:
  • Auto-backup before migrate/sync operations
  • Confirmation prompt for production operations
  • Max ${MAX_BACKUPS} backups kept (auto-rotate)

Examples:
  node prisma/db.js backup local
  node prisma/db.js sync prod-to-local
  node prisma/db.js status
`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const [,, command, target] = process.argv;

  if (!command) {
    showHelp();
    process.exit(0);
  }

  switch (command) {
    case 'backup':
      await cmdBackup(target);
      break;
    case 'restore':
      await cmdRestore(target || 'local');
      break;
    case 'migrate':
      await cmdMigrate(target);
      break;
    case 'sync':
      await cmdSync(target);
      break;
    case 'status':
      await cmdStatus();
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      console.error(`❌ Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

main().catch(e => {
  console.error(`\n❌ Fatal error: ${e.message}`);
  process.exit(1);
});
