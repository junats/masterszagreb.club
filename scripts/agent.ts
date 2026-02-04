import { GoogleGenerativeAI } from '@google/generative-ai';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error('Error: VITE_GEMINI_API_KEY is not set in .env');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function generateTest(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    const prompt = `You are a senior React engineer.
  
  Write a comprehensive unit test using Vitest and React Testing Library for the following React component.
  The component file is named: ${fileName}
  
  Component Code:
  \`\`\`tsx
  ${content}
  \`\`\`
  
  Rules:
  1. Use 'vitest' for 'describe', 'it', 'expect'.
  2. Use '@testing-library/react' for rendering and events.
  3. Should mock any external hooks or services if they are complex.
  4. Return ONLY the code for the test file. No markdown block markers.
  `;

    // Note: Adjust model name based on availability, using gemini-2.0-flash-exp as common default or flash
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        // Strip markdown if present
        return text.replace(/```tsx?/g, '').replace(/```/g, '').trim();
    } catch (error) {
        console.error('Failed to generate test for', fileName, error);
        return null;
    }
}

async function main() {
    // Get changed files (staged and unstaged)
    try {
        const changedFiles = execSync('git diff --name-only HEAD tsx')
            .toString()
            .split('\n')
            .filter(f => f.startsWith('frontend/src/') && f.endsWith('.tsx') && !f.includes('.test.'));

        if (changedFiles.length === 0) {
            console.log('No changed .tsx files found in frontend/src.');
            return;
        }

        console.log('Found changes in:', changedFiles);

        for (const file of changedFiles) {
            const fullPath = path.resolve(__dirname, '..', file);
            if (!fs.existsSync(fullPath)) continue;

            console.log(`Generating test for ${file}...`);
            const testCode = await generateTest(fullPath);

            if (testCode) {
                const dir = path.dirname(fullPath);
                const testFileName = path.basename(fullPath).replace('.tsx', '.test.tsx');
                const testPath = path.join(dir, testFileName);

                fs.writeFileSync(testPath, testCode);
                console.log(`Saved test to ${testPath}`);
            }
        }
    } catch (e) {
        console.error('Error running agent:', e);
    }
}

main();
