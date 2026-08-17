# START HERE - the first card every AI reads

> Claude Code / Codex / Gemini CLI / Copilot: read this one card first.
> It is deliberately short. Jump to the detail links only when you need them.

## What this project is

**{{PROJECT_NAME}}** - {{PROJECT_DESCRIPTION}}

- repo: {{REPO_URL}}
- production branch: `{{PRODUCTION_BRANCH}}`

## The hard rules

1. **Never publish or deploy on your own.** Shipping happens only when
   {{OWNER}} explicitly says so.
2. **Show the change before shipping it.** Run it locally and let a human look
   at the result first.
3. **Do not scan the whole repo, do not read secrets.**
4. **Do not run destructive git commands** (`reset --hard`, force push, broad
   deletes) without approval.
5. **Report in {{REPORT_LANGUAGE}}** - short, direct, no filler.

## First move when you pick this up

Do not guess the current state. Read it:

```bash
git status --short -uall
git log --oneline -8
```

## Where the detail lives

| You want | Read |
|---|---|
| Project rules and validation | [.rtk/project.md](.rtk/project.md) |
| What this project is, folder by folder | [.rtk/memory/project-brief.md](.rtk/memory/project-brief.md) |
| Where things stand right now | [.rtk/memory/current-state.md](.rtk/memory/current-state.md) |
| How {{OWNER}} likes to work | [.rtk/memory/user-preferences.md](.rtk/memory/user-preferences.md) |
| Traps previous agents fell into | [.rtk/memory/mistakes-to-avoid.md](.rtk/memory/mistakes-to-avoid.md) |
| The shared protocol itself | `~/.rtk/RTK.md` |

## Validation

```bash
{{VALIDATE_COMMAND}}
```

<!-- Add project-specific gotchas below this line. `rtk init` will not touch
     anything outside the RTK:BEGIN/END markers. -->
