import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const TEMPLATE_ROOT = path.join(packageRoot, 'templates');
export const PRESET_ROOT = path.join(packageRoot, 'presets');

export function loadTemplate(relativePath) {
  return fs.readFileSync(path.join(TEMPLATE_ROOT, relativePath), 'utf8');
}

/**
 * `{{VAR}}` substitution. An unknown placeholder is a bug in a template or a
 * preset, so it throws rather than silently shipping `{{FOO}}` into a repo.
 */
export function render(template, vars) {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_match, key) => {
    if (!(key in vars)) throw new Error(`Unknown template variable: {{${key}}}`);
    return vars[key];
  });
}

export function listPresets() {
  return fs
    .readdirSync(PRESET_ROOT)
    .filter((name) => name.endsWith('.json'))
    .map((name) => path.basename(name, '.json'))
    .sort();
}

export function loadPreset(name) {
  const file = path.join(PRESET_ROOT, `${name}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Unknown preset "${name}". Available: ${listPresets().join(', ')}`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function git(args, cwd) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function packageName(dir) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    return typeof pkg.name === 'string' ? pkg.name.replace(/^@[^/]+\//, '') : '';
  } catch {
    return '';
  }
}

function guessValidateCommand(dir) {
  if (fs.existsSync(path.join(dir, 'package.json'))) return 'npm run build';
  if (fs.existsSync(path.join(dir, 'Cargo.toml'))) return 'cargo check';
  if (fs.existsSync(path.join(dir, 'go.mod'))) return 'go build ./...';
  if (fs.existsSync(path.join(dir, 'pyproject.toml'))) return 'pytest';
  return 'echo "TODO: your validation command"';
}

/**
 * Best-effort project facts, so `rtk init --yes` produces something usable
 * without an interview. Every value can be overridden by a CLI flag.
 */
export function detectVars(dir) {
  const remote = git(['remote', 'get-url', 'origin'], dir);
  const branch =
    git(['symbolic-ref', '--quiet', '--short', 'HEAD'], dir) ||
    git(['rev-parse', '--abbrev-ref', 'HEAD'], dir);

  return {
    PROJECT_NAME: packageName(dir) || path.basename(path.resolve(dir)),
    PROJECT_DESCRIPTION: 'TODO: one sentence on what this project is and who it is for.',
    PRODUCTION_BRANCH: branch || 'main',
    REPO_URL: remote || 'TODO: repository URL',
    VALIDATE_COMMAND: guessValidateCommand(dir),
    REPORT_LANGUAGE: 'English',
    OWNER: 'the repository owner',
  };
}
