const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    callback(dir);
    return;
  }
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const targetsToUpdate = [
  path.join(__dirname, 'src', 'app', 'page.tsx'),
  path.join(__dirname, 'src', 'components', 'home'),
  path.join(__dirname, 'src', 'components', 'layout')
];

let updatedFiles = 0;
let checkedFiles = 0;

targetsToUpdate.forEach(target => {
  console.log("Scanning target: " + target);
  walkDir(target, function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      checkedFiles++;
      let content = fs.readFileSync(filePath, 'utf8');
      let original = content;
      
      content = content.replace(/border-gray-100 dark:border-white\/5/g, 'border-gray-200 dark:border-white/10');
      content = content.replace(/border-gray-100 dark:border-gray-800/g, 'border-gray-200 dark:border-white/10');
      content = content.replace(/\bborder-gray-100\b/g, 'border-gray-200');
      content = content.replace(/\bdark:border-white\/5\b/g, 'dark:border-white/10');
      content = content.replace(/\bdark:border-gray-800\b/g, 'dark:border-white/10');

      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated: ' + filePath);
        updatedFiles++;
      }
    }
  });
});

console.log(`Checked ${checkedFiles} files. Finished updating ${updatedFiles} files.`);
