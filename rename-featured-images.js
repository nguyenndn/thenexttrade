const fs = require('fs');
const path = require('path');

const dirPath = 'c:/laragon/www/gsn-crm/public/images/featured';
const jsonPath = 'c:/laragon/www/gsn-crm/featured-images-to-generate.json';

// Read JSON to get slugs
const rawData = fs.readFileSync(jsonPath, 'utf8');
const data = JSON.parse(rawData);

// Read files in the directory
const files = fs.readdirSync(dirPath);

// Filter files starting with '2026-05-18_' and sort them alphabetically
const imageFiles = files
  .filter(file => file.startsWith('2026-05-18_'))
  .sort(); // Alphabetical sort works for YYYY-MM-DD_HH-mm-ss

if (imageFiles.length === 0) {
  console.log('No files found to rename.');
  process.exit(0);
}

// Start from index 2 in the json
let jsonIndex = 2;
let renamedCount = 0;

imageFiles.forEach(file => {
  if (jsonIndex >= data.length) {
    console.log('Reached the end of the JSON data, stopping.');
    return;
  }

  const slug = data[jsonIndex].slug;
  const ext = path.extname(file); // Should be .png
  const oldPath = path.join(dirPath, file);
  const newPath = path.join(dirPath, slug + ext);

  try {
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed: ${file} -> ${slug}${ext}`);
    renamedCount++;
  } catch (err) {
    console.error(`Error renaming ${file}: ${err.message}`);
  }

  jsonIndex++;
});

console.log(`Successfully renamed ${renamedCount} files.`);
