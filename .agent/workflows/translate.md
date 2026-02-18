---
description: How to identify and fix untranslated message keys
---

# Translation Sweep Workflow

Use this workflow when you see raw keys (like `categories.gaming` or `dashboard.title`) instead of translated text in the UI.

## 1. Identify the Missing Key
Locate the un-translated string in the UI or logs.
Check if it contains a dot (e.g., `categories.gaming`).

## 2. Check the Naming in Code
Use `grep` to find where the key is generated in the codebase.
```bash
grep -r "categories." src/components
```
**CRITICAL**: Ensure there are no trailing spaces or hidden characters in the `t()` or `translate()` calls.
Example Fix:
- Bad: `t('categories.' + name.toLowerCase() + ' ')`
- Good: `t('categories.' + name.toLowerCase())`

## 3. Update the Language Files
Add the missing key and its value to `frontend/src/i18n/en.json` (and other language files if necessary).
```json
"categories": {
    "gaming": "Gaming"
}
```

## 4. Verify the Fix
Reload the app and verify the UI shows the translated value.
Check for `console.warn` logs regarding missing translation keys.

// turbo
## 5. Automated Check
Run this command to find potentially untranslated keys in the components:
`grep -r "t('" frontend/src/components --include="*.tsx"`
Compare the results with the keys in `en.json`.
