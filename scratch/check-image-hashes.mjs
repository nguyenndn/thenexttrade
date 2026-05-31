import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const publicDir = path.join(process.cwd(), 'public');
const featuredDir = path.join(publicDir, 'images', 'featured');
const articlesDir = path.join(publicDir, 'images', 'articles');

function getMd5Hash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function scanDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory does not exist: ${dirPath}`);
    return [];
  }
  const files = [];
  const list = fs.readdirSync(dirPath);
  for (const item of list) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    if (stat.isFile()) {
      files.push({
        name: item,
        path: fullPath,
        size: stat.size,
      });
    }
  }
  return files;
}

console.log('🔍 Scanning local image directories for content duplicate analysis...');

const featuredFiles = scanDir(featuredDir);
const articleFiles = scanDir(articlesDir);

console.log(`📂 Found ${featuredFiles.length} files in public/images/featured`);
console.log(`📂 Found ${articleFiles.length} files in public/images/articles`);

function analyzeDuplicates(files, label) {
  const hashGroups = new Map(); // hash -> Array of file objects
  
  for (const file of files) {
    const hash = getMd5Hash(file.path);
    if (!hashGroups.has(hash)) {
      hashGroups.set(hash, []);
    }
    hashGroups.get(hash).push(file);
  }

  console.log(`\n📊 Analysis for ${label}:`);
  console.log(`  - Total files scanned: ${files.length}`);
  console.log(`  - Unique image contents (distinct hashes): ${hashGroups.size}`);

  const duplicateGroups = [];
  for (const [hash, group] of hashGroups.entries()) {
    if (group.length > 1) {
      duplicateGroups.push({
        hash,
        size: group[0].size,
        files: group.map(f => f.name)
      });
    }
  }

  console.log(`  - Duplicate image content groups found: ${duplicateGroups.length}`);
  
  if (duplicateGroups.length > 0) {
    // Sort groups by how many duplicates they have (descending)
    duplicateGroups.sort((a, b) => b.files.length - a.files.length);
    console.log(`\n  Top duplicate groups in ${label}:`);
    duplicateGroups.slice(0, 3).forEach((g, i) => {
      console.log(`    Group #${i+1} (Size: ${g.size} bytes, MD5: ${g.hash}):`);
      console.log(`      Shared by ${g.files.length} files. Examples:`);
      g.files.slice(0, 5).forEach(name => console.log(`        - ${name}`));
      if (g.files.length > 5) {
        console.log(`        - ...and ${g.files.length - 5} more files.`);
      }
    });
  } else {
    console.log('  🎉 Awesome! All files have completely unique content.');
  }

  return {
    total: files.length,
    unique: hashGroups.size,
    duplicateGroups
  };
}

const featuredAnalysis = analyzeDuplicates(featuredFiles, 'Featured Images (Thumbnails)');
const articlesAnalysis = analyzeDuplicates(articleFiles, 'Inline Images');

// Save JSON analysis result
fs.writeFileSync(
  path.join(process.cwd(), 'scratch', 'image-hash-analysis.json'),
  JSON.stringify({
    featured: featuredAnalysis,
    inline: articlesAnalysis
  }, null, 2),
  'utf-8'
);
