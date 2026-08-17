# Contributing

Thanks for taking a look. This project is small on purpose.

## Setup

```bash
git clone https://github.com/leavemagic-cyber/relay-task-kernel.git
cd relay-task-kernel
npm test
```

There is nothing to install. Node 18.17+ and zero dependencies.

## Try your change

```bash
node bin/rtk.js init --dir /tmp/scratch --yes --dry-run
```

## Adding a preset

The easiest contribution. A preset is one JSON file plus its templates:

1. `presets/<name>.json` — description, default `vars`, and `extras`
2. `templates/presets/<name>/*.md` — the extra rule files it installs

The test suite picks up new presets automatically and asserts that they
render with no leftover `{{VARIABLES}}`.

## Ground rules for rules

Templates ship into other people's repositories, so:

- **Every rule must be checkable.** An agent should be able to tell whether it
  violated the rule. "Be careful with deploys" is not a rule; "do not run
  deploy CLIs directly" is.
- **Give the reason, not just the rule.** A rule without its reason gets
  discarded the first time it is inconvenient.
- **No project-specific content.** No domains, no personal names, no paths.
  Use a template variable or a preset.
- **Never loosen the global contract** from a project overlay.

## What a PR needs

- `npm test` passes
- new behaviour has a test
- no new dependencies (open an issue first if you think one is unavoidable)

## Reporting a bug

Include the `rtk` command you ran, your OS, `node --version`, and the output.
If it involves a file being mangled, the `.backup.<stamp>` file next to it is
usually the fastest way to show what happened.
