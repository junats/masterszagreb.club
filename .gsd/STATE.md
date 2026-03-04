# App State

**Phase:** General Maintenance
**Task:** Removing dist folder from Git tracking
**Status:** Complete
**What was just accomplished:**
- `dist/` was already in `.gitignore`, but it had been manually tracked by git in the past.
- Ran `git rm -r --cached dist` to remove it from Git's tracking without deleting the actual files on your machine.
- Committed the change (`Chore: untrack dist folder`).

**Next steps:**
- Await the next objective from the user.
