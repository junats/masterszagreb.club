---
description: Run an autonomous agentic loop using local models
---

1. Define the Problem
   - Input: User idea (e.g., "Add a retry mechanism")

2. The Debate (Architecture)
   - Command: `debate "Add a retry mechanism"`
   - Output: A synthesized plan from "Ralph" (Architect) and "Eddie" (Hacker).

3. The Implementation (Coding)
   - Action: User copies the plan.
   - Command: `fix <file> "<plan>"`

4. The Loop (Test & Fix)
   - Command: `autofix <file> "npm test"`
   - Process:
     1. Runs tests.
     2. If fail -> Sends error to AI -> Updates code.
     3. Repeats until pass or max retries.

5. Notification
   - Action: Notify user of success.
