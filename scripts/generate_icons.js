const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const SOURCE_ICON = '/Users/mark/.gemini/antigravity/brain/f6847c83-3fd0-4214-8b19-7afa29e8bea2/uploaded_media_1770232434746.png';
const ASSETS_DIR = '/Users/mark/Projects/TrueTrack/ios/App/App/Assets.xcassets/AppIcon.appiconset';

const SIZES = [
    { size: 20, scale: 1, filename: 'AppIcon-20x20@1x.png' },
    { size: 20, scale: 2, filename: 'AppIcon-20x20@2x.png' },
    { size: 20, scale: 3, filename: 'AppIcon-20x20@3x.png' },
    { size: 29, scale: 1, filename: 'AppIcon-29x29@1x.png' },
    { size: 29, scale: 2, filename: 'AppIcon-29x29@2x.png' },
    { size: 29, scale: 3, filename: 'AppIcon-29x29@3x.png' },
    { size: 40, scale: 1, filename: 'AppIcon-40x40@1x.png' },
    { size: 40, scale: 2, filename: 'AppIcon-40x40@2x.png' },
    { size: 40, scale: 3, filename: 'AppIcon-40x40@3x.png' },
    { size: 60, scale: 2, filename: 'AppIcon-60x60@2x.png' },
    { size: 60, scale: 3, filename: 'AppIcon-60x60@3x.png' },
    { size: 76, scale: 1, filename: 'AppIcon-76x76@1x.png' },
    { size: 76, scale: 2, filename: 'AppIcon-76x76@2x.png' },
    { size: 83.5, scale: 2, filename: 'AppIcon-83.5x83.5@2x.png' },
    { size: 1024, scale: 1, filename: 'AppIcon-512@2x.png' }
];

// Ensure directory exists
if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Generate images
console.log('Generating icons...');
SIZES.forEach(config => {
    const pixelSize = config.size * config.scale;
    const dest = path.join(ASSETS_DIR, config.filename);
    try {
        execSync(`sips -z ${pixelSize} ${pixelSize} "${SOURCE_ICON}" --out "${dest}"`);
        console.log(`✓ Generated ${config.filename}`);
    } catch (e) {
        console.error(`✗ Failed to generate ${config.filename}`, e);
    }
});

// Create Contents.json
const contents = {
    images: SIZES.map(config => ({
        size: `${config.size}x${config.size}`,
        idiom: "iphone", // Simplification, normally varies for ipad but this works for general universal
        filename: config.filename,
        scale: `${config.scale}x`
    })),
    info: {
        version: 1,
        author: "xcode"
    }
};

// Fix up specific idioms for correctness (iPad, etc) if needed, 
// but for now we'll write a standard full set.
// Actually, let's just use the standard Contents.json structure.
const niceContents = {
  "images" : [
    {
      "size" : "20x20",
      "idiom" : "iphone",
      "filename" : "AppIcon-20x20@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "20x20",
      "idiom" : "iphone",
      "filename" : "AppIcon-20x20@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "29x29",
      "idiom" : "iphone",
      "filename" : "AppIcon-29x29@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "29x29",
      "idiom" : "iphone",
      "filename" : "AppIcon-29x29@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "40x40",
      "idiom" : "iphone",
      "filename" : "AppIcon-40x40@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "40x40",
      "idiom" : "iphone",
      "filename" : "AppIcon-40x40@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "60x60",
      "idiom" : "iphone",
      "filename" : "AppIcon-60x60@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "60x60",
      "idiom" : "iphone",
      "filename" : "AppIcon-60x60@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "20x20",
      "idiom" : "ipad",
      "filename" : "AppIcon-20x20@1x.png",
      "scale" : "1x"
    },
    {
      "size" : "20x20",
      "idiom" : "ipad",
      "filename" : "AppIcon-20x20@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "29x29",
      "idiom" : "ipad",
      "filename" : "AppIcon-29x29@1x.png",
      "scale" : "1x"
    },
    {
      "size" : "29x29",
      "idiom" : "ipad",
      "filename" : "AppIcon-29x29@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "40x40",
      "idiom" : "ipad",
      "filename" : "AppIcon-40x40@1x.png",
      "scale" : "1x"
    },
    {
      "size" : "40x40",
      "idiom" : "ipad",
      "filename" : "AppIcon-40x40@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "76x76",
      "idiom" : "ipad",
      "filename" : "AppIcon-76x76@1x.png",
      "scale" : "1x"
    },
    {
      "size" : "76x76",
      "idiom" : "ipad",
      "filename" : "AppIcon-76x76@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "83.5x83.5",
      "idiom" : "ipad",
      "filename" : "AppIcon-83.5x83.5@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "1024x1024",
      "idiom" : "ios-marketing",
      "filename" : "AppIcon-512@2x.png",
      "scale" : "1x"
    }
  ],
  "info" : {
    "version" : 1,
    "author" : "xcode"
  }
};

fs.writeFileSync(path.join(ASSETS_DIR, 'Contents.json'), JSON.stringify(niceContents, null, 2));
console.log('✓ Updated Contents.json');
