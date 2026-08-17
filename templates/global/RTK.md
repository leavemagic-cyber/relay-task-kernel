# RTK - Relay Task Kernel

RTK is a shared operating protocol for AI coding agents: Claude Code, Codex,
Gemini CLI, Copilot, Cursor, and anything else that reads instruction files
from a repository.

Each agent has its own entry file. They all point here, so the rules are
written once and every agent inherits them.

## Load Order

1. Project-local `.rtk/project.md` and the relevant files in `.rtk/memory/`.
2. Project-local agent entry files: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`,
   `.github/copilot-instructions.md`.
3. Global RTK under `~/.rtk/`.

Project rules override global rules **only when they are stricter**. An agent
must never use a project overlay to unlock something global RTK forbids.

## Core Contract

- Plan before Apply.
- Use minimal context.
- Do not scan the whole repository unless the user approves.
- Do not read `.env`, secrets, tokens, credentials, or private keys.
- Do not run destructive commands without explicit approval.
- Do not `git push`, deploy, or publish unless the user explicitly asks.
- Prefer scoped edits, and say what the edit will be before making it.
- End substantial work with Summary, Files read, Files changed, Validation,
  Risks, and Memory Patch.

## The Four Units

| Unit | Answers | Lives in |
|---|---|---|
| **Task Packet** | What is in and out of scope, how do we know it worked | start of a task |
| **Context Capsule** | What is the minimum an agent must load | during a task |
| **Memory Patch** | What did we learn that outlives this task | `.rtk/memory/` |
| **Handoff Capsule** | What does the next agent or session need | end of a task |

The point of the four units is that a session can end at any moment and the
next agent picks up without re-reading the repository.

See `rules/` for behaviour rules and `templates/` for the packet formats.
