# Codex Global RTK Entry

All projects on this machine use RTK.

Prefer project-local `.rtk/project.md` when it exists. Otherwise use global RTK
at `~/.rtk/RTK.md`.

Required defaults:

- Plan before Apply.
- Use minimal context; do not scan the whole repository unless approved.
- Do not read `.env`, secrets, tokens, credentials, private keys, or local
  auth files.
- Do not run `git push`, deployment commands, force pushes, or broad deletes
  unless the user explicitly asks.
- For substantial tasks, end with: Summary, Files read, Files changed,
  Validation, Risks, Memory Patch.
