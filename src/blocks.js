/**
 * Managed-block merging.
 *
 * RTK never owns a whole file. It owns a fenced region inside one:
 *
 *   <!-- RTK:BEGIN PROJECT-RTK-CLAUDE -->
 *   ...generated...
 *   <!-- RTK:END PROJECT-RTK-CLAUDE -->
 *
 * Everything outside the fence is the user's, and re-running `rtk init`
 * must leave it byte-identical. That is the whole contract of this module.
 */

const BLOCK_ID = /^[A-Z0-9][A-Z0-9-]*$/;

export function beginMarker(blockId) {
  return `<!-- RTK:BEGIN ${blockId} -->`;
}

export function endMarker(blockId) {
  return `<!-- RTK:END ${blockId} -->`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function blockPattern(blockId) {
  return new RegExp(
    `${escapeRegExp(beginMarker(blockId))}[\\s\\S]*?${escapeRegExp(endMarker(blockId))}`,
  );
}

export function hasBlock(text, blockId) {
  return blockPattern(blockId).test(text ?? '');
}

/**
 * Return the body between the markers, or null when the block is absent.
 */
export function readBlock(text, blockId) {
  const match = (text ?? '').match(blockPattern(blockId));
  if (!match) return null;
  return match[0]
    .slice(beginMarker(blockId).length, match[0].length - endMarker(blockId).length)
    .trim();
}

/**
 * Merge `content` into `existing` under `blockId`.
 *
 * - block present  -> replaced in place, surrounding text untouched
 * - file non-empty -> block appended after a blank line
 * - file empty     -> block becomes the file
 */
export function mergeBlock(existing, blockId, content, { eol = '\n' } = {}) {
  if (!BLOCK_ID.test(blockId)) {
    throw new Error(`Invalid block id: ${blockId} (expected A-Z, 0-9 and dashes)`);
  }

  const body = String(content).trim();
  const block = [beginMarker(blockId), body, endMarker(blockId)].join('\n');
  const prior = existing == null ? '' : String(existing).replace(/\r\n/g, '\n');

  let merged;
  if (blockPattern(blockId).test(prior)) {
    merged = prior.replace(blockPattern(blockId), () => block);
  } else if (prior.trim() === '') {
    merged = block;
  } else {
    merged = `${prior.trimEnd()}\n\n${block}`;
  }

  return withEol(`${merged.trimEnd()}\n`, eol);
}

/**
 * Drop a block and the blank line it left behind. Used by `rtk eject`.
 */
export function removeBlock(existing, blockId, { eol = '\n' } = {}) {
  const prior = String(existing ?? '').replace(/\r\n/g, '\n');
  if (!blockPattern(blockId).test(prior)) return withEol(prior, eol);
  const stripped = prior.replace(blockPattern(blockId), '').replace(/\n{3,}/g, '\n\n');
  const trimmed = stripped.trim();
  return trimmed === '' ? '' : withEol(`${trimmed}\n`, eol);
}

export function withEol(text, eol) {
  const lf = String(text).replace(/\r\n/g, '\n');
  return eol === '\r\n' ? lf.replace(/\n/g, '\r\n') : lf;
}
