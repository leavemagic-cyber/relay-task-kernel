import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { applyPlan, buildPlan, checkPlan, ejectPlan } from '../src/scaffold.js';
import { detectVars, listPresets, loadPreset } from '../src/templates.js';

const sandboxes = [];

after(() => {
  for (const dir of sandboxes) fs.rmSync(dir, { recursive: true, force: true });
});

function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rtk-test-'));
  sandboxes.push(dir);
  return dir;
}

function init(dir, options = {}) {
  const plan = buildPlan({ scope: 'project', projectDir: dir, ...options });
  return applyPlan(plan, { vars: detectVars(dir), cwd: dir, ...options });
}

function eject(dir, options = {}) {
  const plan = buildPlan({ scope: 'project', projectDir: dir, ...options });
  return ejectPlan(plan, { cwd: dir, ...options });
}

test('init writes an entry file for every agent', () => {
  const dir = sandbox();
  init(dir);

  for (const file of [
    'START_HERE.md',
    'AGENTS.md',
    'CLAUDE.md',
    'GEMINI.md',
    '.github/copilot-instructions.md',
    '.rtk/project.md',
    '.rtk/memory/project-brief.md',
  ]) {
    assert.ok(fs.existsSync(path.join(dir, file)), `missing ${file}`);
  }
});

test('no template variable leaks into output', () => {
  const dir = sandbox();
  init(dir);

  const leaked = fs
    .readdirSync(path.join(dir, '.rtk', 'memory'))
    .map((name) => fs.readFileSync(path.join(dir, '.rtk', 'memory', name), 'utf8'))
    .concat(fs.readFileSync(path.join(dir, 'START_HERE.md'), 'utf8'))
    .filter((text) => /\{\{[A-Z0-9_]+\}\}/.test(text));

  assert.equal(leaked.length, 0);
});

test('re-running changes nothing', () => {
  const dir = sandbox();
  init(dir);
  const second = init(dir);

  assert.equal(second.changed, 0);
  assert.equal(second.backedUp.length, 0);
});

test('user edits outside the markers survive re-init', () => {
  const dir = sandbox();
  init(dir);

  const file = path.join(dir, 'CLAUDE.md');
  fs.writeFileSync(file, `${fs.readFileSync(file, 'utf8')}\n## Local note\ndo not lose me\n`);

  init(dir);

  assert.match(fs.readFileSync(file, 'utf8'), /## Local note\ndo not lose me/);
});

test('eject preserves user content outside RTK markers and backs up changed files', () => {
  const dir = sandbox();
  init(dir);

  const file = path.join(dir, 'CLAUDE.md');
  const managed = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, `# Local preface\n${managed}\n## Local note\ndo not lose me\n`);

  const report = eject(dir);

  assert.equal(
    fs.readFileSync(file, 'utf8'),
    '# Local preface\n\n## Local note\ndo not lose me\n',
  );
  assert.ok(report.updated.includes('CLAUDE.md'));
  assert.ok(fs.readdirSync(dir).some((name) => /^CLAUDE\.backup\..*\.md$/.test(name)));
});

test('eject deletes files containing only RTK content, including owned files', () => {
  const dir = sandbox();
  init(dir);

  const projectReport = eject(dir);
  assert.equal(fs.existsSync(path.join(dir, 'START_HERE.md')), false);
  assert.ok(projectReport.deleted.includes('START_HERE.md'));

  const home = sandbox();
  const globalPlan = buildPlan({ scope: 'global', projectDir: dir, home });
  applyPlan(globalPlan, { vars: detectVars(dir), cwd: home });
  const globalReport = ejectPlan(globalPlan, { cwd: home });

  assert.equal(fs.existsSync(path.join(home, '.rtk', 'schemas', 'task-packet.schema.json')), false);
  assert.ok(globalReport.deleted.includes('.rtk/schemas/task-packet.schema.json'));
});

test('eject dry run reports changes but does not alter files', () => {
  const dir = sandbox();
  init(dir);
  const file = path.join(dir, 'CLAUDE.md');
  const before = fs.readFileSync(file, 'utf8');

  const report = eject(dir, { dryRun: true });

  assert.ok(report.deleted.includes('START_HERE.md'));
  assert.ok(report.deleted.includes('CLAUDE.md'));
  assert.ok(report.backedUp.length > 0);
  assert.equal(fs.existsSync(path.join(dir, 'START_HERE.md')), true);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});

test('check reports missing files after eject', () => {
  const dir = sandbox();
  init(dir);
  const plan = buildPlan({ scope: 'project', projectDir: dir });

  ejectPlan(plan, { cwd: dir });

  assert.ok(checkPlan(plan, { cwd: dir }).every((result) => result.status === 'missing'));
});

test('an overwrite leaves a timestamped backup', () => {
  const dir = sandbox();
  init(dir);

  const file = path.join(dir, 'CLAUDE.md');
  fs.writeFileSync(file, '# clobbered\n');
  const report = init(dir);

  assert.equal(report.backedUp.length, 1);
  assert.ok(fs.readdirSync(dir).some((name) => /^CLAUDE\.backup\..*\.md$/.test(name)));
});

test('dry run reports the same work but writes nothing', () => {
  const dir = sandbox();
  const report = init(dir, { dryRun: true });

  assert.ok(report.created.length > 5);
  assert.equal(fs.existsSync(path.join(dir, 'CLAUDE.md')), false);
});

test('check fails when a managed block is deleted, passes after re-init', () => {
  const dir = sandbox();
  init(dir);
  const plan = buildPlan({ scope: 'project', projectDir: dir });

  assert.equal(checkPlan(plan, { cwd: dir }).every((r) => r.status === 'ok'), true);

  fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# I deleted the block\n');
  const broken = checkPlan(plan, { cwd: dir }).filter((r) => r.status !== 'ok');
  assert.deepEqual(broken.map((r) => r.status), ['block-missing']);

  init(dir);
  assert.equal(checkPlan(plan, { cwd: dir }).every((r) => r.status === 'ok'), true);
});

test('check reports a missing file', () => {
  const dir = sandbox();
  const plan = buildPlan({ scope: 'project', projectDir: dir });
  assert.ok(checkPlan(plan, { cwd: dir }).every((r) => r.status === 'missing'));
});

test('every preset renders and adds its extra files', () => {
  for (const name of listPresets()) {
    const dir = sandbox();
    const preset = loadPreset(name);
    init(dir, { preset });

    for (const extra of preset.extras.filter((e) => e.scope === 'project')) {
      assert.ok(fs.existsSync(path.join(dir, extra.path)), `${name}: missing ${extra.path}`);
    }
  }
});

test('global scope targets ~/.rtk and ~/.codex without touching the repo', () => {
  const home = sandbox();
  const dir = sandbox();
  const plan = buildPlan({ scope: 'global', projectDir: dir, home });

  applyPlan(plan, { vars: detectVars(dir), cwd: home });

  assert.ok(fs.existsSync(path.join(home, '.rtk', 'RTK.md')));
  assert.ok(fs.existsSync(path.join(home, '.rtk', 'schemas', 'task-packet.schema.json')));
  assert.ok(fs.existsSync(path.join(home, '.codex', 'AGENTS.md')));
  assert.equal(fs.existsSync(path.join(dir, 'CLAUDE.md')), false);
});

test('the generated schema is valid JSON', () => {
  const home = sandbox();
  const dir = sandbox();
  applyPlan(buildPlan({ scope: 'global', projectDir: dir, home }), {
    vars: detectVars(dir),
    cwd: home,
  });

  const raw = fs.readFileSync(path.join(home, '.rtk', 'schemas', 'task-packet.schema.json'), 'utf8');
  assert.equal(JSON.parse(raw).title, 'RTK Task Packet');
});
