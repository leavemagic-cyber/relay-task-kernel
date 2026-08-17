import fs from 'node:fs';
import path from 'node:path';

/**
 * Filesystem side of the scaffolder: UTF-8 without BOM, idempotent writes,
 * timestamped backups before any overwrite, and a dry-run mode that reports
 * exactly what a real run would do.
 */

export class Report {
  constructor() {
    this.created = [];
    this.updated = [];
    this.unchanged = [];
    this.backedUp = [];
    this.skipped = [];
  }

  add(kind, file, note) {
    this[kind].push(note ? `${file} (${note})` : file);
  }

  get changed() {
    return this.created.length + this.updated.length;
  }

  get isEmpty() {
    return this.changed === 0 && this.skipped.length === 0;
  }
}

export function readIfExists(file) {
  try {
    return fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export function ensureDir(dir, { dryRun = false } = {}) {
  if (dryRun || fs.existsSync(dir)) return;
  fs.mkdirSync(dir, { recursive: true });
}

function backupPath(file, stamp) {
  const dir = path.dirname(file);
  const ext = path.extname(file);
  const base = path.basename(file, ext);
  return path.join(dir, `${base}.backup.${stamp}${ext || '.txt'}`);
}

/**
 * Write `content` to `file`, backing up any differing existing file first.
 * Returns the report kind that was recorded.
 */
export function writeFile(file, content, options = {}) {
  const { report, dryRun = false, backup = true, stamp = 'manual', label = file } = options;
  const existing = readIfExists(file);

  if (existing === content) {
    report?.add('unchanged', label);
    return 'unchanged';
  }

  if (existing === null) {
    if (!dryRun) {
      ensureDir(path.dirname(file));
      fs.writeFileSync(file, content, 'utf8');
    }
    report?.add('created', label);
    return 'created';
  }

  if (backup) {
    const target = backupPath(file, stamp);
    if (!dryRun) fs.copyFileSync(file, target);
    report?.add('backedUp', path.basename(target));
  }
  if (!dryRun) fs.writeFileSync(file, content, 'utf8');
  report?.add('updated', label);
  return 'updated';
}

/**
 * A stable, filename-safe timestamp. Passed in rather than read from the
 * clock inside writeFile so one run produces one backup suffix.
 */
export function timestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

export function relative(from, to) {
  const rel = path.relative(from, to);
  return rel.split(path.sep).join('/') || '.';
}
