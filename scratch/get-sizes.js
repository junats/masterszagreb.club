const fs = require('fs');
const path = require('path');

function getWebpSize(filepath) {
    const buf = fs.readFileSync(filepath);
    const riff = buf.toString('ascii', 0, 4);
    const webp = buf.toString('ascii', 8, 12);
    if (riff !== 'RIFF' || webp !== 'WEBP') {
        return null;
    }
    const type = buf.toString('ascii', 12, 16);
    if (type === 'VP8 ') {
        const width = buf.readUInt16LE(26) & 0x3fff;
        const height = buf.readUInt16LE(28) & 0x3fff;
        return { width, height };
    } else if (type === 'VP8L') {
        const n = buf.readUInt32LE(21);
        const width = (n & 0x3fff) + 1;
        const height = ((n >> 14) & 0x3fff) + 1;
        return { width, height };
    } else if (type === 'VP8X') {
        const width = (buf.readUInt32LE(24) & 0xffffff) + 1;
        const height = (buf.readUInt32LE(27) & 0xffffff) + 1;
        return { width, height };
    }
    return null;
}

const dir = '/Users/mark/Projects/masters/nightclub-website/assests';
fs.readdirSync(dir).filter(f => f.endsWith('.webp')).forEach(file => {
    const size = getWebpSize(path.join(dir, file));
    if (size) {
        console.log(`${file}: ${size.width}x${size.height} (Aspect ratio: ${(size.width / size.height).toFixed(2)})`);
    } else {
        console.log(`${file}: Unknown size`);
    }
});
