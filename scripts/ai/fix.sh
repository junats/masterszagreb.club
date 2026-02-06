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

def complete_path(path_fragment):
    # Basic rudimentary autocomplete checking
    if os.path.exists(path_fragment):
        return path_fragment
    # Check current directory
    local_path = os.path.join(os.getcwd(), path_fragment)
    if os.path.exists(local_path):
        return local_path
    return path_fragment

def main():
    args = sys.argv[1:]
    
    file_path = None
    instruction = None

    # SMART ARG PARSING
    if len(args) == 0:
        # No args? Interactive Mode
        print("\n🤖 \033[1mLocal AI Fixer\033[0m")
        file_path = input("📂  File to fix: ").strip()
        instruction = input("💬  Instruction: ").strip()
    elif len(args) == 1:
        # One arg? Assume it's the file, prompt for instruction
        file_path = args[0]
        instruction = input(f"💬  Instruction for {file_path}: ").strip()
    else:
        # Two+ args? First is file, rest is instruction (NO QUOTES NEEDED)
        file_path = args[0]
        instruction = " ".join(args[1:])

    # Validate File
    file_path = complete_path(file_path)
    if not os.path.exists(file_path):
        print(f"\n❌  Error: File not found: {file_path}")
        print("    Tip: You can drag and drop the file here.")
        sys.exit(1)

    # Validate Instruction
    if not instruction:
        print("\n❌  Error: Instruction cannot be empty.")
        sys.exit(1)

    print(f"\n🧠  Considering: \033[1m{file_path}\033[0m")
    print(f"📝  Instruction: \033[36m{instruction}\033[0m")
    print("⏳  Thinking... (Ctrl+C to cancel)")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            file_content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)

    # Construct the prompt
    full_prompt = f"Instruction: {instruction}\n\nCode to Rewrite:\n{file_content}\n\nRewritten Code:"
    system_prompt = "You are a senior developer. Output ONLY the raw code. No markdown, no explanations. Do not wrap code in backticks. IMPORTANT: You MUST output the ENTIRE file content for the file provided in 'Code to Rewrite'. Do not summarize or truncate. Do not use comments like // ... rest of code."

    # Payload
    payload = {
        "model": MODEL,
        "stream": False,
        "options": {
            "num_ctx": CONTEXT_WINDOW,
            "temperature": 0.1
        },
        "system": system_prompt,
        "prompt": full_prompt
    }

    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(API_URL, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            if 'response' in result:
                print("\n" + result['response'])
                # Optional: Save to .local_fix automatically? 
                # For now let's just print to stdout as expected by the workflow
            else:
                print("Error: No response field in API result:", result)
    except urllib.error.URLError as e:
        print(f"\n🚨  \033[31mConnection Failed\033[0m: {e}")
        print("    Make sure Ollama is running: \033[1mollama serve\033[0m")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n🛑  Cancelled.")
        sys.exit(0)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
