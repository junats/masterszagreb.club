const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');

async function checkImage(filepath) {
    try {
        const result = await Tesseract.recognize(filepath, 'eng');
        const text = result.data.text;
        console.log(`Checking ${path.basename(filepath)}... text length: ${text.length}`);
        if (text.toLowerCase().includes('andreas') || text.toLowerCase().includes('kali') || text.toLowerCase().includes('ono') || text.toLowerCase().includes('26.06')) {
            console.log(`🎯 FOUND in ${path.basename(filepath)}:\n${text}`);
            return true;
        }
    } catch (e) {
        console.error(`Error processing ${filepath}:`, e.message);
    }
    return false;
}

async function main() {
    const dirs = [
        '/Users/mark/Projects/masters/nightclub-website/assests/events',
        '/Users/mark/Projects/masters/nightclub-website/dist/assests/events',
        '/Users/mark/Projects/masters/nightclub-website/assests'
    ];
    
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.png'));
        console.log(`Scanning ${files.length} files in ${dir}...`);
        for (const file of files) {
            await checkImage(path.join(dir, file));
        }
    }
    console.log('Scan complete.');
}

main();
