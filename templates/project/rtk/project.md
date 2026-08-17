# {{PROJECT_NAME}} - Project RTK Overlay

This repository uses Global RTK (`~/.rtk/RTK.md`) and adds stricter project
rules on top. An overlay may only tighten the global contract, never loosen it.

## Project Purpose

{{PROJECT_DESCRIPTION}}

## Strict Project Rules

- Do not publish, deploy, or push unless {{OWNER}} explicitly asks.
- Production deploys are triggered from `{{PRODUCTION_BRANCH}}`; do not run
  deploy CLIs directly.
- Do not change public URLs or slugs without a redirect plan.
- Do not stage unrelated dirty files with the current task.
- Report in {{REPORT_LANGUAGE}}.

<!-- Add your own strict rules here. Keep each one testable: an agent should
     be able to tell whether it violated the rule. -->

## Usual Validation

- `{{VALIDATE_COMMAND}}`
- Spot-check the pages or entry points the task touched.
