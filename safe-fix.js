const fs = require('fs');
const path = require('path');

// 1. RE-APPLY Content Menu Group fixes
function performFixes() {
    // 1. src/app/admin/articles/page.tsx
    let p = 'c:/laragon/www/gsn-crm/src/app/admin/articles/page.tsx';
    let code = fs.readFileSync(p, 'utf8');
    code = code.replace(/hover:bg-\[#00a872\]/g, 'hover:bg-[#00C888]');
    fs.writeFileSync(p, code);

    // 2. src/components/admin/cms/CategoryModal.tsx
    p = 'c:/laragon/www/gsn-crm/src/components/admin/cms/CategoryModal.tsx';
    code = fs.readFileSync(p, 'utf8');
    code = code.replace(/hover:bg-\[#00b078\]/g, 'hover:bg-[#00C888]');
    fs.writeFileSync(p, code);

    // 3. src/components/admin/cms/TagModal.tsx
    p = 'c:/laragon/www/gsn-crm/src/components/admin/cms/TagModal.tsx';
    code = fs.readFileSync(p, 'utf8');
    code = code.replace(/hover:bg-\[#00b078\]/g, 'hover:bg-[#00C888]');
    fs.writeFileSync(p, code);

    // 4. src/components/admin/articles/ArticleList.tsx
    p = 'c:/laragon/www/gsn-crm/src/components/admin/articles/ArticleList.tsx';
    code = fs.readFileSync(p, 'utf8');
    code = code.replace(/hover:bg-\[#00a872\]/g, 'hover:bg-[#00C888]');
    // API Fix
    if (!code.includes('if (!res.ok) {')) {
        code = code.replace(
            /await fetch\(\`\/api\/articles\/\$\{quickEditId\}\`, \{[\s\S]*?body: JSON\.stringify\(quickEditData\)\n\s*\}\);/g,
            `const res = await fetch(\`/api/articles/\$\{quickEditId\}\`, {\n                method: "PUT",\n                headers: { "Content-Type": "application/json" },\n                body: JSON.stringify(quickEditData)\n            });\n\n            if (!res.ok) {\n                const errorData = await res.json().catch(() => ({}));\n                throw new Error(errorData.error || "Failed to save article");\n            }`
        );
    }
    // Catch block
    code = code.replace(/catch \(err\) \{\n\s*toast\.error\("Failed to update article"\);/g, 'catch (err: any) {\n            toast.error(err.message || "Failed to update article");');
    fs.writeFileSync(p, code);

    // 5. src/components/admin/articles/ArticleRowActions.tsx
    p = 'c:/laragon/www/gsn-crm/src/components/admin/articles/ArticleRowActions.tsx';
    code = fs.readFileSync(p, 'utf8');
    code = code.replace(/<Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">/g, '<Button variant="ghost" size="icon" aria-label="Article Actions" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">');
    fs.writeFileSync(p, code);

    // 6. src/components/admin/articles/TagInput.tsx
    p = 'c:/laragon/www/gsn-crm/src/components/admin/articles/TagInput.tsx';
    code = fs.readFileSync(p, 'utf8');
    code = code.replace(/<Button variant="ghost" size="icon" onClick=\{[^}]*\} className="h-auto/g, '<Button variant="ghost" size="icon" aria-label="Remove Tag" onClick={() => removeTag(tag.id)} className="h-auto');
    if (!code.includes('throw new Error("API Error")')) {
        code = code.replace(
            /if \(res\.ok\) \{\n\s*const tag = await res\.json\(\);\n\s*addTag\(tag\);\n\s*\}/g,
            `if (!res.ok) throw new Error("API Error");\n            const tag = await res.json();\n            addTag(tag);`
        );
    }
    fs.writeFileSync(p, code);

    // 7. src/components/admin/articles/ArticleForm.tsx
    p = 'c:/laragon/www/gsn-crm/src/components/admin/articles/ArticleForm.tsx';
    code = fs.readFileSync(p, 'utf8');
    code = code.replace(/hover:bg-\[#00B078\]/g, 'hover:bg-[#00C888]');
    if (!code.includes('if (!res.ok) throw new Error("Auto-save failed");')) {
        code = code.replace(
            /await fetch\(\`\/api\/articles\/\$\{initialData\?\.id\}\`, \{[\s\S]*?body: JSON\.stringify\(formData\),\n\s*\}\);/g,
            `const res = await fetch(\`/api/articles/\$\{initialData?.id\}\`, {\n                method: "PUT",\n                headers: { "Content-Type": "application/json" },\n                body: JSON.stringify(formData),\n            });\n            if (!res.ok) throw new Error("Auto-save failed");`
        );
    }
    fs.writeFileSync(p, code);
}
performFixes();
console.log("Restores complete!");

// 2. SAFE Global Toast replacement
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        let f = path.join(dir, file);
        const stat = fs.statSync(f);
        if (stat && stat.isDirectory() && !f.includes('node_modules') && !f.includes('.next')) {
            results = results.concat(walk(f));
        } else if (f.endsWith('.ts') || f.endsWith('.tsx')) {
            results.push(f);
        }
    });
    return results;
}

const files = walk('c:/laragon/www/gsn-crm/src');
let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Safer regex: The stuff between catch(err){ and toast.error(...) must NOT contain '{' or '}'
    // This strictly confines the match to a single shallow block!
    const rx = /catch\s*\(\s*([a-zA-Z0-9_]+)(?:\s*:\s*any)?\s*\)\s*\{([^}{]*?)toast\.error\(\s*(["'])(.+?)\3\s*\)/g;
    
    let updated = content.replace(rx, (match, errVar, beforeToast, quote, errorMsg) => {
        return `catch (${errVar}: any) {${beforeToast}toast.error(${errVar} instanceof Error ? ${errVar}.message : (${errVar}?.message || ${quote}${errorMsg}${quote}))`;
    });

    if (content !== updated) {
        fs.writeFileSync(file, updated);
        console.log("Updated Toast:", file);
        modifiedCount++;
    }
});
console.log("Total updated toasts:", modifiedCount);
