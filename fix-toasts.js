const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('c:/laragon/www/gsn-crm/src');
let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // First, find catch blocks that have a parameter and a toast.error with a string literal
    // We use a safe replacing strategy:
    // Pattern: catch (varName) { ... toast.error("String") ... }
    
    let updated = content.replace(/catch\s*\(\s*([a-zA-Z0-9_]+)(?:\s*:\s*any)?\s*\)\s*\{([\s\S]*?)toast\.error\(\s*(["'])(.+?)\3\s*\)/g, (match, errVar, beforeToast, quote, errorMsg) => {
        
        // Safety check: if beforeToast contains 'catch' or 'function', we probably matched too much
        if (beforeToast.includes('catch ') || beforeToast.includes('function ')) {
            return match; // skip
        }

        // We replace with: catch (varName: any) { ... toast.error(varName?.message || "String")
        return `catch (${errVar}: any) {${beforeToast}toast.error(${errVar}?.message || ${quote}${errorMsg}${quote})`;
    });

    if (content !== updated) {
        fs.writeFileSync(file, updated);
        console.log("Updated:", file);
        modifiedCount++;
    }
});

console.log("Total modified:", modifiedCount);
