const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

let count = 0;
walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We want to match: <Button [anything] variant="ghost" [anything]>[anything](Cancel|Back|Hủy|Quay lại|Close)[anything]</Button>
    // Because JSX can span multiple lines, we use [\s\S]*? for "anything"
    let newContent = content.replace(/(<Button[\s\S]*?)variant=(?:'|")ghost(?:'|")([\s\S]*?>[\s\S]*?(?:Cancel|Back|Hủy|Quay lại|Close)[\s\S]*?<\/Button>)/gi, '$1variant="outline"$2');
    
    // Check for Cancel buttons that might have been missed due to whitespace or nested spans inside the button
    // The previous regex catches most standard buttons.
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated: ${filePath}`);
        count++;
    }
  }
});

console.log(`Finished. Updated ${count} files.`);
