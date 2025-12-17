import jwt from 'jsonwebtoken';
import fs from 'fs';

// --- CONFIGURATION ---
const TEAM_ID = '95XR3Q4NF6'; // Updated from your previous edit
const KEY_ID = 'APQRZA5V4U';  // Updated from your previous edit
const CLIENT_ID = 'com.truetrack.app.service'; // Your Service ID
const PRIVATE_KEY_PATH = '/Users/mark/Downloads/AuthKey_APQRZA5V4U.p8'; // Updated to your Downloads folder

// Check if user updated config
if (TEAM_ID === 'YOUR_TEAM_ID') {
    console.error('❌ Error: Please edit this script with your TEAM_ID, KEY_ID, and path to .p8 file.');
    process.exit(1);
}

try {
    const privateKey = fs.readFileSync(PRIVATE_KEY_PATH);

    const token = jwt.sign({}, privateKey, {
        algorithm: 'ES256',
        expiresIn: '180d', // 6 months (max allowed by Apple)
        audience: 'https://appleid.apple.com',
        issuer: '95XR3Q4NF6',
        subject: 'com.truetrack.app.service', // FIXED: Added quotes
        keyid: 'APQRZA5V4U',           // FIXED: Added quotes
    });

    console.log('\n✅ Apple Client Secret Generated Successfully!\n');
    console.log(token);
    console.log('\n👉 Copy the token above and paste it into the Supabase configured "Secret Key" field.\n');

} catch (err) {
    if (err.code === 'ENOENT') {
        console.error(`❌ Error: Could not find private key file at path: ${PRIVATE_KEY_PATH}`);
    } else {
        console.error('❌ Error generating token:', err.message);
    }
}
