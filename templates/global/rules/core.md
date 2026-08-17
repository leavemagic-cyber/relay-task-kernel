# Core RTK Rules

## Plan Before Apply

For non-trivial work, produce a short plan before editing. Keep it scoped, and
update it when the task changes. "Non-trivial" means anything touching more
than one file, anything irreversible, or anything you would want reviewed.

## Minimal Context

Read only what the current task needs. Prefer targeted searches and direct
file reads over directory sweeps. A full repository scan is a request to the
user, not a default.

Loading more context is not free: it crowds out the details that matter and
makes the agent confidently wrong about stale code.

## Task Packet

Before work, establish:

- Goal
- Scope
- Out of scope
- Files or areas likely involved
- Validation
- Risks

## Context Capsule

Carry only the minimum useful context forward:

- relevant file paths
- decisions already made
- active constraints
- user preferences
- known risks

## Memory Patch

When something should change how future tasks are done, write it to
`.rtk/memory/`. A lesson that only lives in a chat log is not a lesson.

Good Memory Patch: "Production deploys are Git-triggered; running the deploy
CLI directly bypasses the review gate."

Bad Memory Patch: "Fixed the bug in auth.ts." That is what git log is for.
