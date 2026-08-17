import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import { applyPlan, buildPlan, checkPlan, ejectPlan } from './scaffold.js';
import { detectVars, listPresets, loadPreset } from './templates.js';

const USAGE = `rtk - Relay Task Kernel

  One handoff contract that Claude Code, Codex, Gemini CLI and Copilot all read.

Usage
  rtk init [options]     write the agent contract into a repo (and optionally ~/.rtk)
  rtk check [options]    verify every managed block is still present
  rtk eject [options]    remove RTK-managed content while preserving your own
  rtk presets            list available presets
  rtk help | --help
  rtk --version

Scope
  --project              only this repo (default)
  --global               only ~/.rtk and ~/.codex/AGENTS.md
  --all                  both

Options
  --dir <path>           target repo (default: cwd)
  --preset <name>        start from a preset (see \`rtk presets\`)
  --yes, -y              accept detected values, no questions
  --dry-run              report what would change, write nothing
  --no-backup            overwrite without writing .backup.<stamp> files
  --crlf                 write CRLF line endings instead of LF
  --set KEY=VALUE        override one template variable (repeatable)

Variable shorthands
  --name, --description, --branch, --repo, --validate, --lang, --owner

Examples
  npx github:leavemagic-cyber/relay-task-kernel init --all
  rtk init --preset content-site --name "My Blog" --yes
  rtk check --all
`;

const SHORTHAND = {
  name: 'PROJECT_NAME',
  description: 'PROJECT_DESCRIPTION',
  branch: 'PRODUCTION_BRANCH',
  repo: 'REPO_URL',
  validate: 'VALIDATE_COMMAND',
  lang: 'REPORT_LANGUAGE',
  owner: 'OWNER',
};

export function parseArgs(argv) {
  const options = {
    command: 'init',
    scope: 'project',
    dir: process.cwd(),
    preset: null,
    yes: false,
    dryRun: false,
    backup: true,
    eol: '\n',
    overrides: {},
  };

  const rest = [...argv];
  if (rest[0] && !rest[0].startsWith('-')) options.command = rest.shift();

  while (rest.length > 0) {
    const arg = rest.shift();
    const next = () => {
      const value = rest.shift();
      if (value === undefined) throw new Error(`Missing value for ${arg}`);
      return value;
    };

    switch (arg) {
      case '--project': options.scope = 'project'; break;
      case '--global': options.scope = 'global'; break;
      case '--all': options.scope = 'all'; break;
      case '--dir': options.dir = path.resolve(next()); break;
      case '--preset': options.preset = next(); break;
      case '--yes': case '-y': options.yes = true; break;
      case '--dry-run': options.dryRun = true; break;
      case '--no-backup': options.backup = false; break;
      case '--crlf': options.eol = '\r\n'; break;
      case '--help': case '-h': options.command = 'help'; break;
      case '--version': case '-v': options.command = 'version'; break;
      case '--set': {
        const [key, ...value] = next().split('=');
        if (value.length === 0) throw new Error('--set expects KEY=VALUE');
        options.overrides[key.trim()] = value.join('=');
        break;
      }
      default: {
        const match = /^--([a-z-]+)$/.exec(arg);
        const key = match && SHORTHAND[match[1]];
        if (!key) throw new Error(`Unknown option: ${arg}`);
        options.overrides[key] = next();
      }
    }
  }

  return options;
}

const QUESTIONS = [
  ['PROJECT_NAME', 'Project name'],
  ['PROJECT_DESCRIPTION', 'One sentence: what is it, who is it for'],
  ['PRODUCTION_BRANCH', 'Production branch'],
  ['VALIDATE_COMMAND', 'Command that validates a change'],
  ['REPORT_LANGUAGE', 'Language agents should report in'],
];

async function interview(vars) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const answers = { ...vars };
    stdout.write('\nPress Enter to accept the detected value.\n\n');
    for (const [key, prompt] of QUESTIONS) {
      const answer = (await rl.question(`  ${prompt} [${answers[key]}]: `)).trim();
      if (answer) answers[key] = answer;
    }
    stdout.write('\n');
    return answers;
  } finally {
    rl.close();
  }
}

function printReport(report, { dryRun }) {
  const sections = [
    ['created', 'Created'],
    ['updated', 'Updated'],
    ['deleted', 'Deleted'],
    ['backedUp', 'Backed up'],
    ['unchanged', 'Unchanged'],
  ];

  for (const [key, title] of sections) {
    const items = report[key];
    if (items.length === 0) continue;
    stdout.write(`\n${title}\n`);
    for (const item of items) stdout.write(`  ${item}\n`);
  }

  const verb = dryRun ? 'would change' : 'changed';
  stdout.write(`\n${report.changed} file(s) ${verb}, ${report.unchanged.length} already current.\n`);
  if (dryRun) stdout.write('Dry run: nothing was written.\n');
}

export async function run(argv) {
  const options = parseArgs(argv);

  if (options.command === 'help') {
    stdout.write(USAGE);
    return 0;
  }

  if (options.command === 'version') {
    // Read rather than `import ... with { type: 'json' }`, which needs Node 20.10+.
    const pkgUrl = new URL('../package.json', import.meta.url);
    const pkg = JSON.parse(fs.readFileSync(pkgUrl, 'utf8'));
    stdout.write(`${pkg.version}\n`);
    return 0;
  }

  if (options.command === 'presets') {
    for (const name of listPresets()) {
      const preset = loadPreset(name);
      stdout.write(`  ${name.padEnd(16)} ${preset.description ?? ''}\n`);
    }
    return 0;
  }

  if (!['init', 'check', 'eject'].includes(options.command)) {
    stdout.write(`Unknown command: ${options.command}\n\n${USAGE}`);
    return 1;
  }

  const preset = options.preset ? loadPreset(options.preset) : null;
  const plan = buildPlan({ scope: options.scope, projectDir: options.dir, preset });

  if (options.command === 'check') {
    const results = checkPlan(plan, { cwd: options.dir });
    const broken = results.filter((r) => r.status !== 'ok');
    for (const result of results) {
      const mark = result.status === 'ok' ? 'ok  ' : 'FAIL';
      stdout.write(`  ${mark} ${result.label}${result.status === 'ok' ? '' : `  <- ${result.status}`}\n`);
    }
    stdout.write(
      broken.length === 0
        ? `\nAll ${results.length} managed files are intact.\n`
        : `\n${broken.length} of ${results.length} need \`rtk init\`.\n`,
    );
    return broken.length === 0 ? 0 : 1;
  }

  if (options.command === 'eject') {
    const report = ejectPlan(plan, {
      cwd: options.dir,
      dryRun: options.dryRun,
      backup: options.backup,
      eol: options.eol,
    });

    printReport(report, { dryRun: options.dryRun });
    return 0;
  }

  let vars = { ...detectVars(options.dir), ...(preset?.vars ?? {}) };
  if (!options.yes && stdin.isTTY) vars = await interview(vars);
  vars = { ...vars, ...options.overrides };

  const report = applyPlan(plan, {
    vars,
    cwd: options.dir,
    dryRun: options.dryRun,
    backup: options.backup,
    eol: options.eol,
  });

  printReport(report, { dryRun: options.dryRun });

  if (!options.dryRun && report.changed > 0) {
    stdout.write('\nNext: fill in the TODOs in .rtk/memory/, then commit.\n');
  }

  return 0;
}
