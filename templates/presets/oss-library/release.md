# Release Rules - {{PROJECT_NAME}}

- Do not bump the version in `package.json` (or equivalent) as part of a
  feature or fix. Version bumps are their own reviewed change.
- Do not create git tags, GitHub releases, or publish to a registry.
- Do not edit `CHANGELOG.md` release headings; add entries under Unreleased.
- Public API changes require an explicit note in the summary, including
  whether they are breaking.
- Validate with `{{VALIDATE_COMMAND}}` before claiming a change works.
- If a change would alter published behaviour, say so plainly rather than
  burying it in a diff summary.
