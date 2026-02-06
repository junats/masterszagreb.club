#!/usr/bin/env python3
import sys
import json
import urllib.request
import urllib.error
import os

# Configuration
MODEL = "qwen2.5-coder:7b"
CONTEXT_WINDOW = 16384
API_URL = "http://localhost:11434/api/generate"

def main():
    if len(sys.argv) < 2:
        print("Usage: ./scripts/write_tests.py <source_file>")
        sys.exit(1)

    source_file = sys.argv[1]

    if not os.path.exists(source_file):
        print(f"Error: File not found: {source_file}")
        sys.exit(1)

    # Determine test filename (e.g., App.tsx -> App.test.tsx)
    base, ext = os.path.splitext(source_file)
    test_file = f"{base}.test{ext}"
    if ext == ".ts":
        test_file = f"{base}.test.ts"
    elif ext == ".tsx":
        test_file = f"{base}.test.tsx"
    
    # Check if test file already exists
    if os.path.exists(test_file):
        print(f"⚠️  Test file already exists: {test_file}")
        overwrite = input("Overwrite? (y/N): ").lower()
        if overwrite != 'y':
            print("Aborted.")
            sys.exit(0)

    print(f"🧪  \033[1mQA Agent\033[0m reading: {source_file}")
    print("⏳  Writing comprehensive tests...")

    try:
        with open(source_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)

    # Prompt
    system_prompt = "You are a Senior QA Engineer using Vitest and React Testing Library. Output ONLY the raw code for the test file. No markdown."
    user_prompt = f"""
    Write a comprehensive unit test suite for the following code.
    
    Requirements:
    Requirements:
    1. Use 'vitest' and '@testing-library/react'.
    2. IMPORT RULES: Use `import '@testing-library/jest-dom'` (NOT /extend-expect).
    3. SYNTAX RULES: Use `vi.fn()` and `vi.mock()` instead of `jest`. Do NOT use `jest`.
    4. Mock any external imports or hooks that look complex.
    5. Test happy paths and error states.
    6. Provide high coverage.
    
    Source Code:
    {content}
    
    Test File Code:
    """

    # Payload
    payload = {
        "model": MODEL,
        "stream": False,
        "options": {
            "num_ctx": CONTEXT_WINDOW,
            "temperature": 0.2 
        },
        "system": system_prompt,
        "prompt": user_prompt
    }

    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(API_URL, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            test_code = result.get('response', '').strip()
            
            # Strip markdown
            if test_code.startswith("```"):
                lines = test_code.split("\n")
                # Remove first line (```typescript) and last line (```)
                test_code = "\n".join(lines[1:-1])

            # Write to file
            with open(test_file, 'w', encoding='utf-8') as f:
                f.write(test_code)
            
            print(f"\n✅  \033[32mCreated: {test_file}\033[0m")
            print("    Run it with: npm test")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
