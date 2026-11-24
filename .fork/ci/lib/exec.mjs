// Run a command with a timeout that kills the whole process group (research R9).
import { spawn } from 'node:child_process';

const TAIL_LINES = 60;

export function lastLines(text, n = TAIL_LINES) {
  const ls = text.replace(/\r/g, '').split('\n');
  if (ls.at(-1) === '') ls.pop();
  return ls.slice(-n).join('\n');
}

/**
 * @returns {Promise<{code:number, timedOut:boolean, notFound:boolean, durationMs:number, tail:string}>}
 */
export function runCommand(argv, { cwd, timeoutSec = 600, env = process.env } = {}) {
  return new Promise(resolve => {
    const start = Date.now();
    let buf = '';
    let timedOut = false;
    let settled = false;
    const finish = r => {
      if (settled) return;
      settled = true;
      resolve({ durationMs: Date.now() - start, ...r });
    };

    let child;
    try {
      child = spawn(argv[0], argv.slice(1), { cwd, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      finish({ code: 127, timedOut: false, notFound: true, tail: err.message });
      return;
    }
    const onData = d => {
      buf += d;
      if (buf.length > 400_000) buf = buf.slice(-200_000);
    };
    child.stdout.setEncoding('utf8').on('data', onData);
    child.stderr.setEncoding('utf8').on('data', onData);

    const timer = setTimeout(() => {
      timedOut = true;
      try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ }
    }, timeoutSec * 1000);

    child.on('error', err => {
      clearTimeout(timer);
      finish({ code: 127, timedOut: false, notFound: err.code === 'ENOENT', tail: err.message });
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      finish({ code: code ?? (signal ? 137 : 1), timedOut, notFound: false, tail: lastLines(buf) });
    });
  });
}
