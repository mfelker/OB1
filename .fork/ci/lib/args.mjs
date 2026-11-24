// CLI argument contract for fork-ci bin scripts (specs/001-fork-ci/contracts/cli.md).
import { parseArgs } from 'node:util';

export class UsageError extends Error {
  constructor(message, usage) {
    super(message);
    this.name = 'UsageError';
    this.usage = usage;
    this.exitCode = 2;
  }
}

const JOB_RESULTS = ['success', 'failure', 'cancelled', 'skipped'];

const SPECS = {
  detect: {
    usage: 'usage: detect.mjs --event pull_request|push (--base <sha> --head <sha> | --before <sha> --after <sha>) --upstream-ref <ref>',
    options: {
      event: { enum: ['pull_request', 'push'], required: true },
      base: { requiredIf: a => a.event === 'pull_request' },
      head: { requiredIf: a => a.event === 'pull_request' },
      before: { requiredIf: a => a.event === 'push' },
      after: { requiredIf: a => a.event === 'push' },
      'upstream-ref': { required: true },
    },
  },
  'run-folder': {
    usage: 'usage: run-folder.mjs --path <folder> --mode strict|advisory --origin fork|upstream --out <file> [--timeout-sec <n>]',
    options: {
      path: { required: true },
      mode: { enum: ['strict', 'advisory'], required: true },
      origin: { enum: ['fork', 'upstream'], required: true },
      out: { required: true },
      'timeout-sec': { default: '600', pattern: /^[1-9][0-9]*$/ },
    },
  },
  verdict: {
    usage: 'usage: verdict.mjs --detect <file> --results <dir> --detect-result R --test-result R --test-sql-result R --self-test-result R --summary <file> [--bypass-range <a>..<b> --upstream-ref <ref>]',
    options: {
      detect: { required: true },
      results: { required: true },
      'detect-result': { enum: JOB_RESULTS, required: true },
      'test-result': { enum: JOB_RESULTS, required: true },
      'test-sql-result': { enum: JOB_RESULTS, required: true },
      'self-test-result': { enum: JOB_RESULTS, required: true },
      'bypass-range': { pattern: /^[^.\s]+\.\.[^.\s]+$/ },
      'upstream-ref': { requiredIf: a => a['bypass-range'] !== undefined },
      summary: { required: true },
    },
  },
};

/** Parse and validate argv for a named CLI. Throws UsageError. */
export function parseCli(name, argv) {
  const spec = SPECS[name];
  if (!spec) throw new Error(`unknown cli ${name}`);
  let values;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: Object.fromEntries(Object.keys(spec.options).map(k => [k, { type: 'string' }])),
      strict: true,
      allowPositionals: false,
    }));
  } catch (err) {
    throw new UsageError(err.message, spec.usage);
  }
  const out = { ...values };
  for (const [key, rule] of Object.entries(spec.options)) {
    if (out[key] === undefined && rule.default !== undefined) out[key] = rule.default;
  }
  for (const [key, rule] of Object.entries(spec.options)) {
    const v = out[key];
    const required = rule.required || (rule.requiredIf && rule.requiredIf(out));
    if (required && (v === undefined || v === '')) throw new UsageError(`missing --${key}`, spec.usage);
    if (v !== undefined && rule.enum && !rule.enum.includes(v)) {
      throw new UsageError(`--${key} must be one of ${rule.enum.join('|')}`, spec.usage);
    }
    if (v !== undefined && rule.pattern && !rule.pattern.test(v)) {
      throw new UsageError(`--${key} has an invalid value`, spec.usage);
    }
  }
  return out;
}

/** Parse argv for a bin script, printing usage and exiting 2 on error. */
export function cliArgs(name, argv = process.argv.slice(2)) {
  try {
    return parseCli(name, argv);
  } catch (err) {
    if (err instanceof UsageError) {
      process.stderr.write(`${err.message}\n${err.usage}\n`);
      process.exit(2);
    }
    throw err;
  }
}
