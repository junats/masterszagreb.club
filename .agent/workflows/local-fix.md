---
description: Use local Ollama model to fix code without consuming cloud tokens
---

1. Verify the target file exists
   - Input: $1 (File path)
   - Input: $2 (Instruction)

2. Run the local fix script
   - Command: `./scripts/run_local_fix.sh "$1" "$2" > "$1.local_fix"`
   - Description: "Generating fix using local LLM..."

3. Show the diff to the user
   - Command: `diff -u "$1" "$1.local_fix"`
   - Description: "Review the proposed changes below. If satisfied, rename the .local_fix file to the original."

4. Notification
   - Action: Notify the user that the local fix has been generated but NOT applied. They must verify and apply it manually (or Ask me to apply it).
