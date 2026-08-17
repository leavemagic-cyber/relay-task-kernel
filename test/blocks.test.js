import test from 'node:test';
import assert from 'node:assert/strict';

import { mergeBlock, readBlock, removeBlock, hasBlock } from '../src/blocks.js';

test('creates the block when the file does not exist', () => {
  const out = mergeBlock(null, 'PROJECT-RTK-CLAUDE', 'Use RTK mode.');
  assert.equal(
    out,
    '<!-- RTK:BEGIN PROJECT-RTK-CLAUDE -->\nUse RTK mode.\n<!-- RTK:END PROJECT-RTK-CLAUDE -->\n',
  );
});

test('appends the block after existing user content', () => {
  const out = mergeBlock('# My notes\n', 'A', 'generated');
  assert.match(out, /^# My notes\n\n<!-- RTK:BEGIN A -->/);
});

test('replaces only the block and preserves text on both sides', () => {
  const before = mergeBlock('# Header\n', 'A', 'v1');
  const withTail = `${before}\n## My own section\nkeep me\n`;

  const after = mergeBlock(withTail, 'A', 'v2');

  assert.equal(readBlock(after, 'A'), 'v2');
  assert.match(after, /^# Header\n/);
  assert.match(after, /## My own section\nkeep me/);
  assert.ok(!after.includes('v1'));
});

test('is idempotent', () => {
  const once = mergeBlock('# Header\n', 'A', 'body');
  assert.equal(mergeBlock(once, 'A', 'body'), once);
});

test('normalises CRLF input and can emit CRLF output', () => {
  const crlf = '# Header\r\n\r\nsome text\r\n';
  assert.ok(!mergeBlock(crlf, 'A', 'body').includes('\r'));
  assert.ok(mergeBlock(crlf, 'A', 'body', { eol: '\r\n' }).includes('\r\n'));
});

test('does not confuse two different blocks in one file', () => {
  let file = mergeBlock(null, 'A', 'alpha');
  file = mergeBlock(file, 'B', 'beta');
  file = mergeBlock(file, 'A', 'alpha2');

  assert.equal(readBlock(file, 'A'), 'alpha2');
  assert.equal(readBlock(file, 'B'), 'beta');
});

test('readBlock and hasBlock report absence', () => {
  assert.equal(readBlock('# nothing here', 'A'), null);
  assert.equal(hasBlock('# nothing here', 'A'), false);
});

test('removeBlock leaves user content and collapses the gap', () => {
  const file = mergeBlock('# Header\n', 'A', 'body');
  assert.equal(removeBlock(file, 'A'), '# Header\n');
});

test('rejects a malformed block id', () => {
  assert.throws(() => mergeBlock(null, 'lower case', 'x'), /Invalid block id/);
});
