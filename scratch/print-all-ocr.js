const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');

async function checkImage(filepath) {
    try {
        const result = await Tesseract.recognize(filepath, 'eng');
        const text = result.data.text.trim();
        if (text) {
            console.log(`--- ${path.basename(filepath)} ---`);
            console.log(text.substring(0, 150));
        }
    } catch (e) {
        // ignore
    }
}

async function main() {
    const dirs = [
        '/Users/mark/Projects/masters/nightclub-website/assests',
        '/Users/mark/Projects/masters/nightclub-website/dist/assests/events'
    ];
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp') || f.endsWith('.jpg'));
        for (const file of files) {
            await checkImage(path.join(dir, file));
        }
    }
}

main();
