---
description: Execute a task using multi-agent orchestration (parallel subagents)
---

# Orchestrated Execution

Use this workflow when you want to leverage parallel subagents for complex tasks.

## Prerequisites
- Task should benefit from parallelization (multi-file, multi-concern)
- SPEC.md should be finalized
- ROADMAP.md should exist

## Steps

1. **Define the orchestration scope**
   - Identify independent subtasks
   - Group by concern (backend, frontend, tests, docs)

2. **Request parallel execution**
   Use explicit language:
   ```
   "Execute this in parallel with specialized agents:
    - Agent 1: [task]
    - Agent 2: [task]
    - Agent 3: [task]
    Then synthesize results."
   ```

3. **Monitor progress**
   - Request status updates after each agent completes
   - Watch for conflicts between parallel changes

4. **Synthesize and verify**
   - Orchestrator combines results
   - Run `/verify --parallel` for multi-check verification

## Example

```
/orchestrate "Implement user settings feature"
- Backend Agent: Create settings API endpoints
- Frontend Agent: Build settings UI components
- Test Agent: Generate test suite
- Docs Agent: Update README

After all complete, merge changes and run full test suite.
```

## Fallback to Local

If cloud tokens are limited, use local AI for repetitive subtasks:
```bash
# Parallel in terminal (local)
fix src/api/settings.ts "Add CRUD endpoints" &
fix src/components/Settings.tsx "Add form UI" &
wait

# Generate tests
gentest src/api/settings.ts
gentest src/components/Settings.tsx

# Auto-fix
autofix src/api/settings.ts "npm test"
```
