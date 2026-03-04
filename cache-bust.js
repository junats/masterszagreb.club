const fs = require('fs');

const version = Date.now();
const files = ['dist/index.html', 'dist/merch.html'];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        // Look for local .css or .js files and add a version query parameter
        content = content.replace(/(href|src)="((?!http|data:)[^"]+\.(css|js))"/g, `$1="$2?v=${version}"`);
        fs.writeFileSync(file, content);
        console.log(`✅ Appended cache-busting version ?v=${version} to ${file}`);
    }
});
