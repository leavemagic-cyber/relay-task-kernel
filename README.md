# RTK — Relay Task Kernel

**One handoff contract that Claude Code, Codex, Gemini CLI and Copilot all read.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D18.17-brightgreen)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

繁體中文說明請看 [README.zh-TW.md](README.zh-TW.md)。

---

## The problem

You use more than one coding agent. Each wants its own instruction file:

```
AGENTS.md                        Codex
CLAUDE.md                        Claude Code
GEMINI.md                        Gemini CLI
.github/copilot-instructions.md  Copilot
```

So you write the rules four times. Then you tighten one rule and update three
files. Then a new session starts, the agent has no idea what happened
yesterday, and you re-explain the project for the ninth time — right before it
force-pushes something.

RTK makes those four files thin pointers to one shared contract, and gives the
project a small, deliberate memory that survives across sessions and across
agents.

## Quick start

```bash
npx github:leavemagic-cyber/relay-task-kernel init --all
```

`--all` writes the machine-wide protocol to `~/.rtk/` **and** the project
overlay into the current repo. Answer four questions, or pass `--yes` to take
the detected values.

Already have a `CLAUDE.md` you like? Keep it. RTK only manages the region
between its own markers and never touches the rest of the file.

## What it writes

```
~/.rtk/                        the protocol, shared by every repo
├── RTK.md                     load order + core contract
├── rules/                     core, forbidden-actions, code-edit
├── templates/                 task packet, context capsule, memory patch, handoff
└── schemas/                   machine-readable task packet
~/.codex/AGENTS.md             Codex global entry

your-repo/
├── START_HERE.md              the one card every agent reads first
├── AGENTS.md                  ─┐
├── CLAUDE.md                   ├ thin entries, all pointing at the same rules
├── GEMINI.md                   │
├── .github/copilot-instructions.md ─┘
└── .rtk/
    ├── project.md             rules that are stricter than global
    └── memory/
        ├── project-brief.md   what this is, folder by folder
        ├── current-state.md   what is half-finished right now
        ├── user-preferences.md how you like to work
        └── mistakes-to-avoid.md what already went wrong once
```

`START_HERE.md` is the piece that matters most in practice. One short card,
read first by every agent, containing the hard rules and the command that
tells it the current state — instead of an agent inferring the project from
whatever files it happens to open.

## The merge contract

Every generated region is fenced:

```markdown
# My own notes at the top — untouched

<!-- RTK:BEGIN PROJECT-RTK-CLAUDE -->
...generated...
<!-- RTK:END PROJECT-RTK-CLAUDE -->

## My own section at the bottom — also untouched
```

Which means:

- **Idempotent.** Re-running `rtk init` on an unchanged repo reports
  `0 file(s) changed`.
- **Non-destructive.** Your text outside the markers survives every upgrade.
- **Reversible.** Any overwrite leaves `CLAUDE.backup.20260817-143022.md` next
  to the original.
- **Checkable.** `rtk check` tells you when someone deleted a block, which is
  how agents silently lose their rules.

## Commands

| Command | What it does |
|---|---|
| `rtk init` | write the contract into this repo |
| `rtk init --global` | write `~/.rtk/` and `~/.codex/AGENTS.md` only |
| `rtk init --all` | both |
| `rtk check` | verify every managed block is still intact (exit 1 if not) |
| `rtk eject` | remove RTK's blocks, keep everything you wrote yourself |
| `rtk presets` | list presets |

Useful flags: `--dry-run`, `--yes`, `--dir <path>`, `--preset <name>`,
`--no-backup`, `--crlf`, `--set KEY=VALUE`.

```bash
rtk init --dry-run          # see exactly what would change
rtk check --all             # good CI step
```

## Presets

```bash
rtk init --preset content-site
```

| Preset | For |
|---|---|
| `content-site` | blogs, docs, publications — adds a publishing gate so drafts never leak into production |
| `oss-library` | published packages — agents must not touch versions, tags, or releases |

A preset is a small JSON file adding template variables and extra rule files.
[Adding one](presets/) is about ten lines.

## Template variables

Detected from git and `package.json`, overridable by flag:

| Variable | Flag | Detected from |
|---|---|---|
| `PROJECT_NAME` | `--name` | `package.json` name, else directory |
| `PROJECT_DESCRIPTION` | `--description` | — |
| `PRODUCTION_BRANCH` | `--branch` | current git branch |
| `REPO_URL` | `--repo` | `git remote get-url origin` |
| `VALIDATE_COMMAND` | `--validate` | `package.json` / `Cargo.toml` / `go.mod` / `pyproject.toml` |
| `REPORT_LANGUAGE` | `--lang` | — |
| `OWNER` | `--owner` | — |

## Design notes

**The overlay may only tighten.** A project rule can forbid something global
RTK allows. It can never permit something global RTK forbids. Otherwise the
safety rules are one careless commit from being switched off.

**Memory is four files, not a database.** `current-state.md` is the one that
earns its keep: it holds the half-finished migration, the thing that is
intentionally broken, the deploy being watched. That is what a new session
cannot reconstruct from the code.

**Minimal context is a rule, not a suggestion.** Loading more of the repo is
not free — it crowds out the detail that mattered and makes an agent
confidently wrong about stale code.

**Zero dependencies.** This tool writes markdown into your repo. It has no
business pulling a dependency tree in to do that.

## Origin

RTK started as an internal PowerShell script for a Traditional Chinese
content site run day to day by Claude Code, Codex and Gemini in rotation —
about 90 published articles. The rules here are the ones that stopped real
incidents: an agent publishing a draft, an agent deploying straight to
production, an agent losing yesterday's decision.

This repo is that script generalised, made cross-platform, and stripped of
anything project-specific.

## Contributing

Issues and PRs welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). New presets
are the easiest place to start.

```bash
npm test        # 26 tests, no dependencies
```

## License

MIT
