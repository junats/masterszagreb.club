# Phase 4 local AI Lessons Learned

The fully autonomous continuous integration script loop (`debate.py`, `fix.sh`, `gentest.py`, `autofix.py`) operates successfully but exposes some inherent limitations in its naive bash/subprocess design:

1. **Environment Passthrough:** Python's `subprocess.run(shell=True)` inside `autofix.py` executes in a barebone `/bin/sh` shell that lacks user profile variables (such as `.zshrc`). This causes commands like `npm` or `node` to report "command not found". 
   * **The Lesson:** Always execute `autofix.py` commands explicitly through a pre-sourced shell (e.g., `zsh -i -c 'npm run test'`) or using absolute binary paths to ensure the validation commands have correctly scoped environments. 
   * **The Danger:** Because the agent is blind, when `npm test` fails with "npm not found", it hallucinates patches (like bash installation scripts) into the target TypeScript files attempting to solve it!

2. **Standard Output Pollution:** `fix.sh` pipes stdout directly into the file. Because it prints status messages ("Considering: file.ts"), those strings are piped directly into the code, causing syntax errors in the next step.
   * **The Lesson:** Testing scripts should strictly isolate tool logging (stderr) from pure code output (stdout), or write file changes directly through a defined API rather than bash pipes. 

3. **Zero-Shot Test Generation Context:** The `gentest.py` script correctly architects Vitest files based on the source code, but natively fails to include module imports (e.g. `import { add } from './file'`).
   * **The Lesson:** Future iterations of `gentest.py` must include prompt enhancements strictly reminding the LLM to write imports referencing the testing file context accurately.

Despite these environmental integration edge cases, the AI cleanly debugged compilation errors and autonomously pushed fixes iteratively until Vitest passed. The local Ollama implementation is surprisingly effective!
