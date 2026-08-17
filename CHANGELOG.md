# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0]

First public release. Generalised from an internal PowerShell script into a
cross-platform CLI.

### Added

- `rtk init` — scaffolds the RTK contract into a repo, `~/.rtk/`, or both
- `rtk check` — verifies every managed block is still present, exit 1 if not
- `rtk presets` — lists available presets
- Managed-block merging: generated regions are fenced by
  `RTK:BEGIN`/`RTK:END`, so user content outside them survives re-runs
- Timestamped backups before any overwrite, disableable with `--no-backup`
- `--dry-run`, `--yes`, `--dir`, `--crlf`, `--set KEY=VALUE`
- Variable detection from git and `package.json` / `Cargo.toml` / `go.mod` /
  `pyproject.toml`
- Agent entries for Claude Code, Codex, Gemini CLI and Copilot, plus a shared
  `START_HERE.md` card
- Four-file project memory: brief, current state, preferences, mistakes
- Presets: `content-site`, `oss-library`
- 26 tests, zero dependencies

### Changed from the original script

- PowerShell only → cross-platform Node
- Templates hardcoded in the script → external files with `{{VARIABLES}}`
- Project-specific rules → presets and template variables
- Added `GEMINI.md` and `START_HERE.md`, which the original never generated
- Added `rtk check`, dry-run, and a test suite

[Unreleased]: https://github.com/leavemagic-cyber/relay-task-kernel/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/leavemagic-cyber/relay-task-kernel/releases/tag/v0.1.0
