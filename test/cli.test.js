import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { parseArgs } from '../src/cli.js';

test('defaults to project-scoped init', () => {
  const options = parseArgs([]);
  assert.equal(options.command, 'init');
  assert.equal(options.scope, 'project');
  assert.equal(options.dryRun, false);
  assert.equal(options.backup, true);
});

test('reads command, scope and flags', () => {
  const options = parseArgs(['check', '--all', '--dry-run', '--no-backup', '--crlf']);
  assert.equal(options.command, 'check');
  assert.equal(options.scope, 'all');
  assert.equal(options.dryRun, true);
  assert.equal(options.backup, false);
  assert.equal(options.eol, '\r\n');
});

test('eject accepts the existing scope, target and output flags', () => {
  const options = parseArgs([
    'eject', '--all', '--dir', 'target-repo', '--preset', 'content-site', '--dry-run', '--crlf',
  ]);
  assert.equal(options.command, 'eject');
  assert.equal(options.scope, 'all');
  assert.equal(options.dir, path.resolve('target-repo'));
  assert.equal(options.preset, 'content-site');
  assert.equal(options.dryRun, true);
  assert.equal(options.eol, '\r\n');
});

test('shorthand flags map to template variables', () => {
  const options = parseArgs(['init', '--name', 'My Site', '--branch', 'trunk']);
  assert.deepEqual(options.overrides, { PROJECT_NAME: 'My Site', PRODUCTION_BRANCH: 'trunk' });
});

test('--set takes KEY=VALUE and keeps equals signs in the value', () => {
  const options = parseArgs(['init', '--set', 'VALIDATE_COMMAND=make test ARGS=-v']);
  assert.equal(options.overrides.VALIDATE_COMMAND, 'make test ARGS=-v');
});

test('rejects unknown options and missing values', () => {
  assert.throws(() => parseArgs(['init', '--nope']), /Unknown option/);
  assert.throws(() => parseArgs(['init', '--name']), /Missing value/);
  assert.throws(() => parseArgs(['init', '--set', 'BROKEN']), /KEY=VALUE/);
});

test('-h and -v are recognised anywhere', () => {
  assert.equal(parseArgs(['--help']).command, 'help');
  assert.equal(parseArgs(['init', '-h']).command, 'help');
  assert.equal(parseArgs(['-v']).command, 'version');
});
