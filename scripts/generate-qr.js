const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

async function generateQR() {
    const targetUrl = 'https://masterszagreb.club/prices';
    const assestsDir = path.join(__dirname, '..', 'assests');
    
    if (!fs.existsSync(assestsDir)) {
        fs.mkdirSync(assestsDir, { recursive: true });
    }

    console.log(`Generating QR code for: ${targetUrl}`);

    // 1. High-Res PNG (1024x1024) with high error correction
    const pngPath = path.join(assestsDir, 'qr-prices.png');
    await QRCode.toFile(pngPath, targetUrl, {
        width: 1024,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    });
    console.log(`✅ Generated PNG QR: ${pngPath}`);

    // 2. Scalable Vector SVG (Monochrome Masters White on Black)
    const svgPath = path.join(assestsDir, 'qr-prices.svg');
    const svgString = await QRCode.toString(targetUrl, {
        type: 'svg',
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
            dark: '#ffffff',
            light: '#000000'
        }
    });
    fs.writeFileSync(svgPath, svgString, 'utf-8');
    console.log(`✅ Generated Monochrome SVG QR: ${svgPath}`);

    // 3. Clean Black & White SVG for printing
    const svgPrintPath = path.join(assestsDir, 'qr-prices-print.svg');
    const svgPrintString = await QRCode.toString(targetUrl, {
        type: 'svg',
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    });
    fs.writeFileSync(svgPrintPath, svgPrintString, 'utf-8');
    console.log(`✅ Generated Print-Ready SVG QR: ${svgPrintPath}`);
}

generateQR().catch(err => {
    console.error('QR Generation failed:', err);
    process.exit(1);
});
