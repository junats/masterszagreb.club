#!/usr/bin/env python3
import sys
import subprocess
import json
import urllib.request
import os

# Configuration
MODEL = "qwen2.5-coder:7b"
API_URL = "http://localhost:11434/api/generate"
MAX_RETRIES = 3

def query_ollama(system_prompt, user_prompt):
    payload = {
        "model": MODEL,
        "stream": False,
        "options": {"num_ctx": 16384, "temperature": 0.2},
        "system": system_prompt,
        "prompt": user_prompt
    }
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(API_URL, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8')).get('response', '').strip()
    except Exception as e:
        print(f"AI Error: {e}")
        return None

def run_command(cmd):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode, result.stdout + result.stderr
    except Exception as e:
        return 1, str(e)

def main():
    if len(sys.argv) < 3:
        print("Usage: ./scripts/auto_fix.py <file_to_fix> <test_command>")
        sys.exit(1)

    file_path = sys.argv[1]
    test_cmd = " ".join(sys.argv[2:])

    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        sys.exit(1)

    print(f"🔧  \033[1mAuto-Fix Agent\033[0m monitoring: {file_path}")
    print(f"🧪  Test Command: {test_cmd}\n")

    for attempt in range(1, MAX_RETRIES + 1):
        print(f"➡️   Attempt {attempt}/{MAX_RETRIES}: Running tests...")
        code, output = run_command(test_cmd)

        if code == 0:
            print("\n✅  \033[32mTests Passed! Work complete.\033[0m")
            sys.exit(0)

        print(f"❌  \033[31mTests Failed.\033[0m Output sample:")
        print(output[:500] + "..." if len(output) > 500 else output)
        print("\n🧠  Asking AI to fix...")

        # Read file
        with open(file_path, 'r') as f:
            content = f.read()

        # Prompt AI
        system = "You are a Senior Debugger. Output ONLY the raw code for the file to fix the error. No markdown."
        prompt = f"The following code failed the test.\n\nTest Output:\n{output}\n\nSource Code:\n{content}\n\nFix the code to pass the test:"
        
        fix = query_ollama(system, prompt)
        
        if fix:
            # Strip markdown if present
            if fix.startswith("```"):
                fix = "\n".join(fix.split("\n")[1:-1])
            
            # Save
            with open(file_path, 'w') as f:
                f.write(fix)
            print("💾  Applied fix.")
        else:
            print("💀  AI failed to generate a fix.")
            break

    print("\n⛔️  Max retries reached. Manual intervention required.")
    sys.exit(1)

if __name__ == "__main__":
    main()
