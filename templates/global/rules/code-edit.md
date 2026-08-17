# Code Edit Rules

- Prefer the smallest useful patch.
- Follow the surrounding style, naming, and local helpers.
- Say what the edit will be before making it.
- Use structured APIs or parsers rather than regex over source when available.
- Do not refactor unrelated code while fixing something.
- Preserve unrelated user changes in a dirty worktree; never stage them.
- Validate with the narrowest reliable command first, then widen if needed.
- Report commands that could not be run, and why.
