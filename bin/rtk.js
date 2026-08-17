#!/usr/bin/env node
import { run } from '../src/cli.js';

try {
  process.exitCode = await run(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`rtk: ${error.message}\n`);
  process.exitCode = 1;
}
