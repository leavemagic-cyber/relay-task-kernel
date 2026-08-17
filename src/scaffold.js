import os from 'node:os';
import path from 'node:path';

import { mergeBlock, removeBlock, withEol, hasBlock } from './blocks.js';
import { Report, deleteFile, readIfExists, writeFile, timestamp, relative } from './files.js';
import { loadTemplate, render } from './templates.js';

/**
 * The scaffold is declarative: a list of {scope, path, block, template} steps.
 * `buildPlan` decides what should exist, `applyPlan` reconciles the disk with
 * it. Nothing else in the codebase knows the file layout.
 */

/** Files RTK owns outright (no user content ever lives in them). */
const OWNED = new Set(['schemas/task-packet.schema.json']);

const GLOBAL_STEPS = [
  { path: 'RTK.md', block: 'GLOBAL-RTK', template: 'global/RTK.md' },
  { path: 'README.md', block: 'GLOBAL-RTK-README', template: 'global/README.md' },
  { path: 'rules/core.md', block: 'GLOBAL-RTK-CORE', template: 'global/rules/core.md' },
  {
    path: 'rules/forbidden-actions.md',
    block: 'GLOBAL-RTK-FORBIDDEN',
    template: 'global/rules/forbidden-actions.md',
  },
  { path: 'rules/code-edit.md', block: 'GLOBAL-RTK-CODE-EDIT', template: 'global/rules/code-edit.md' },
  {
    path: 'templates/task-packet.md',
    block: 'GLOBAL-RTK-TASK-PACKET',
    template: 'global/templates/task-packet.md',
  },
  {
    path: 'templates/context-capsule.md',
    block: 'GLOBAL-RTK-CONTEXT-CAPSULE',
    template: 'global/templates/context-capsule.md',
  },
  {
    path: 'templates/memory-patch.md',
    block: 'GLOBAL-RTK-MEMORY-PATCH',
    template: 'global/templates/memory-patch.md',
  },
  {
    path: 'templates/handoff-capsule.md',
    block: 'GLOBAL-RTK-HANDOFF-CAPSULE',
    template: 'global/templates/handoff-capsule.md',
  },
  {
    path: 'schemas/task-packet.schema.json',
    template: 'global/schemas/task-packet.schema.json',
  },
];

const PROJECT_STEPS = [
  { path: 'START_HERE.md', block: 'PROJECT-RTK-START-HERE', template: 'project/START_HERE.md' },
  { path: 'AGENTS.md', block: 'PROJECT-RTK-AGENTS', template: 'project/AGENTS.md' },
  { path: 'CLAUDE.md', block: 'PROJECT-RTK-CLAUDE', template: 'project/CLAUDE.md' },
  { path: 'GEMINI.md', block: 'PROJECT-RTK-GEMINI', template: 'project/GEMINI.md' },
  {
    path: '.github/copilot-instructions.md',
    block: 'PROJECT-RTK-COPILOT',
    template: 'project/copilot-instructions.md',
  },
  { path: '.rtk/project.md', block: 'PROJECT-RTK-OVERLAY', template: 'project/rtk/project.md' },
  {
    path: '.rtk/memory/project-brief.md',
    block: 'PROJECT-RTK-BRIEF',
    template: 'project/rtk/memory/project-brief.md',
  },
  {
    path: '.rtk/memory/current-state.md',
    block: 'PROJECT-RTK-CURRENT',
    template: 'project/rtk/memory/current-state.md',
  },
  {
    path: '.rtk/memory/user-preferences.md',
    block: 'PROJECT-RTK-PREFERENCES',
    template: 'project/rtk/memory/user-preferences.md',
  },
  {
    path: '.rtk/memory/mistakes-to-avoid.md',
    block: 'PROJECT-RTK-MISTAKES',
    template: 'project/rtk/memory/mistakes-to-avoid.md',
  },
];

const CODEX_STEP = {
  path: 'AGENTS.md',
  block: 'GLOBAL-RTK-CODEX-ENTRY',
  template: 'codex/AGENTS.md',
};

export function globalRoot(home = os.homedir()) {
  return path.join(home, '.rtk');
}

export function codexRoot(home = os.homedir()) {
  return path.join(home, '.codex');
}

/**
 * @param {object} options
 * @param {'project'|'global'|'all'} options.scope
 * @param {string} options.projectDir
 * @param {object} [options.preset]  parsed preset JSON
 * @param {string} [options.home]
 */
export function buildPlan({ scope, projectDir, preset, home = os.homedir() }) {
  const extras = preset?.extras ?? [];
  const steps = [];

  const push = (scopeName, root, step) =>
    steps.push({
      scope: scopeName,
      template: step.template,
      block: step.block,
      file: path.join(root, step.path),
      owned: OWNED.has(step.path) || !step.block,
    });

  if (scope === 'global' || scope === 'all') {
    for (const step of GLOBAL_STEPS) push('global', globalRoot(home), step);
    for (const extra of extras.filter((e) => e.scope === 'global')) {
      push('global', globalRoot(home), extra);
    }
    push('codex', codexRoot(home), CODEX_STEP);
  }

  if (scope === 'project' || scope === 'all') {
    for (const step of PROJECT_STEPS) push('project', projectDir, step);
    for (const extra of extras.filter((e) => e.scope === 'project')) {
      push('project', projectDir, extra);
    }
  }

  return steps;
}

/**
 * Render every step and reconcile it with disk.
 * Returns a Report; with `dryRun` nothing is written but the report is exact.
 */
export function applyPlan(plan, { vars, cwd = process.cwd(), dryRun = false, backup = true, eol = '\n' }) {
  const report = new Report();
  const stamp = timestamp();

  for (const step of plan) {
    const rendered = render(loadTemplate(step.template), vars);
    const label = relative(cwd, step.file);

    const content = step.owned
      ? withEol(`${rendered.trim()}\n`, eol)
      : mergeBlock(readIfExists(step.file), step.block, rendered, { eol });

    writeFile(step.file, content, { report, dryRun, backup, stamp, label });
  }

  return report;
}

/**
 * Remove RTK's managed content while preserving text outside its fenced
 * blocks. Files owned entirely by RTK are deleted. Every change is backed up
 * by default, and dry runs produce the same report without touching disk.
 */
export function ejectPlan(plan, { cwd = process.cwd(), dryRun = false, backup = true, eol = '\n' } = {}) {
  const report = new Report();
  const stamp = timestamp();

  for (const step of plan) {
    const existing = readIfExists(step.file);
    const label = relative(cwd, step.file);

    if (existing === null) {
      report.add('unchanged', label);
      continue;
    }

    if (step.owned) {
      deleteFile(step.file, { report, dryRun, backup, stamp, label });
      continue;
    }

    if (!hasBlock(existing, step.block)) {
      report.add('unchanged', label);
      continue;
    }

    const content = removeBlock(existing, step.block, { eol });
    if (content.trim() === '') {
      deleteFile(step.file, { report, dryRun, backup, stamp, label });
    } else {
      writeFile(step.file, content, { report, dryRun, backup, stamp, label });
    }
  }

  return report;
}

/**
 * Health check for an already-initialised repo: is every managed block still
 * present? Agents silently lose their rules when someone deletes one.
 */
export function checkPlan(plan, { cwd = process.cwd() } = {}) {
  return plan.map((step) => {
    const existing = readIfExists(step.file);
    const label = relative(cwd, step.file);
    if (existing === null) return { label, status: 'missing' };
    if (step.owned) return { label, status: 'ok' };
    return { label, status: hasBlock(existing, step.block) ? 'ok' : 'block-missing' };
  });
}
