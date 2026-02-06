# 🎭 Multi-Agent Orchestration Guide

> **Goal:** Leverage AI orchestrator features to parallelize work and maximize productivity.

---

## 🧠 What is Orchestration?

Modern AI coding assistants can **spawn subagents** that work in parallel:

| Feature | Claude Code | Cursor | Windsurf | Cline |
|---------|-------------|--------|----------|-------|
| Subagents | ✅ (up to 50) | ✅ (Background Agents) | ✅ (Cascade) | ✅ (Tasks) |
| Parallel Execution | ✅ | ✅ | ✅ | ✅ |
| Independent Context | ✅ | ✅ | ✅ | ✅ |
| Tool Access | ✅ | ✅ | ✅ | ✅ |

---

## 🔧 Claude Code Orchestration

### Triggering Subagents

Claude Code automatically spawns subagents when you ask for:
- **Parallel file operations** ("Update all 5 context files")
- **Multi-step workflows** ("Research, plan, then implement")
- **Complex refactors** ("Refactor auth across 10 files")

### Manual Subagent Patterns

```
You: "I want you to work on this as a team:
     - Agent 1: Research the codebase for auth patterns
     - Agent 2: Write the implementation plan
     - Agent 3: Generate tests for the new feature
     Then synthesize the results."
```

### Best Practices

1. **Be explicit about parallelization**
   ```
   "Work on these 3 tasks in parallel, then combine results"
   ```

2. **Define clear boundaries**
   ```
   "Agent 1 handles backend, Agent 2 handles frontend"
   ```

3. **Request synthesis**
   ```
   "After all agents complete, synthesize into a single plan"
   ```

---

## 🎯 Orchestration + GSD Workflow

### Phase 1: Planning (Orchestrated)

```
/plan "Add user authentication"

→ Orchestrator spawns:
  - Research Agent: Analyzes existing auth patterns
  - Security Agent: Reviews best practices
  - Implementation Agent: Creates ROADMAP.md
  
→ Synthesizes into unified plan
```

### Phase 2: Execution (Parallel)

```
/execute Phase 1

→ Orchestrator spawns:
  - Backend Agent: Implements API routes
  - Frontend Agent: Creates login UI
  - Test Agent: Writes test suite
  
→ All work in parallel, orchestrator merges
```

### Phase 3: Verification (Multi-Check)

```
/verify

→ Orchestrator spawns:
  - Build Agent: Runs `npm run build`
  - Test Agent: Runs `npm test`
  - Lint Agent: Runs `npm run lint`
  
→ Reports combined status
```

---

## 💻 Cursor Background Agents

### Enabling Background Agents

1. Open Cursor Settings
2. Enable "Background Agents" (Beta)
3. Use `@background` or just describe parallel work

### Usage Pattern

```
"@background Run the test suite and fix any failures"
"@background Analyze all components for accessibility issues"
"@background Generate documentation for all exported functions"
```

---

## 🌊 Windsurf Cascade

### Cascade Mode

Windsurf's Cascade automatically:
- Breaks complex tasks into subtasks
- Executes subtasks in optimal order
- Handles dependencies between tasks

### Triggering Cascade

```
"Use cascade mode to refactor the entire auth system:
 1. Analyze current implementation
 2. Design new architecture
 3. Implement changes
 4. Update tests
 5. Update documentation"
```

---

## 🔄 Hybrid Local + Cloud Orchestration

Combine cloud orchestration with local AI:

```
┌─────────────────────────────────────────────────────┐
│  CLOUD ORCHESTRATOR (Claude/Cursor)                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │ Plan    │  │ Review  │  │ Verify  │             │
│  │ Agent   │  │ Agent   │  │ Agent   │             │
│  └────┬────┘  └────┬────┘  └────┬────┘             │
└───────┼────────────┼────────────┼───────────────────┘
        │            │            │
        ▼            ▼            ▼
┌─────────────────────────────────────────────────────┐
│  LOCAL EXECUTION (Ollama)                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │ fix     │  │ gentest │  │ autofix │             │
│  └─────────┘  └─────────┘  └─────────┘             │
└─────────────────────────────────────────────────────┘
```

### Example Workflow

```bash
# 1. Cloud: Plan with orchestration
/plan "Add payment processing" --parallel

# 2. Local: Implement (saves tokens)
fix src/payments/stripe.ts "Implement Stripe integration"
fix src/payments/webhook.ts "Implement webhook handler"

# 3. Local: Generate tests
gentest src/payments/stripe.ts
gentest src/payments/webhook.ts

# 4. Local: Auto-fix failures
autofix src/payments/stripe.ts "npm test"

# 5. Cloud: Verify with multi-agent
/verify --parallel
```

---

## 📋 Quick Reference

| Task Type | Best Approach |
|-----------|---------------|
| Research/Analysis | Cloud Orchestrator (parallel agents) |
| Planning | Cloud Orchestrator (specialized agents) |
| Simple Code Changes | Local `fix` (saves tokens) |
| Complex Refactors | Cloud Orchestrator (parallel files) |
| Test Generation | Local `gentest` |
| Test Fixing | Local `autofix` loop |
| Verification | Cloud Orchestrator (parallel checks) |

---

## 🚨 Orchestration Tips

1. **Don't over-parallelize** - Some tasks are sequential by nature
2. **Use local for repetitive tasks** - Cloud for creative/complex
3. **Request progress updates** - "Report after each agent completes"
4. **Set time limits** - "Complete within 5 minutes"
5. **Ask for conflicts** - "Highlight any conflicting changes"
