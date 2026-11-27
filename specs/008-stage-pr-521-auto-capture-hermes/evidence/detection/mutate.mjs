// Detection checks: apply each mutant to the author's file, run one test, restore. Never commits.
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const [mutantsFile, outFile] = process.argv.slice(2);
const REPO = "/Users/mfelker/Projects/ob1";
const W = `${REPO}/.worktrees/stage-pr-521-auto-capture-hermes`;
const SRC = `${W}/skills/auto-capture-hermes/capture-hermes-session.mjs`;
const original = fs.readFileSync(SRC, "utf8");
const run = (name) => spawnSync("node", [".fork/ci/bin/tdd.mjs", "single", "capture-hermes-session.test.mjs", name], { cwd: REPO, encoding: "utf8" });
const decisive = (out) => out.split("\n").map((l) => l.trim()).find((l) => /AssertionError|^\d+ !== \d+|Error:|no payload printed|timed out/.test(l)) ?? "(no decisive line)";
const summary = (out) => out.split("\n").find((l) => l.startsWith("[tdd]")) ?? "";
const results = [];
for (const m of JSON.parse(fs.readFileSync(mutantsFile, "utf8"))) {
  let mutated = original;
  for (const [find, replace] of m.edits) {
    const n = mutated.split(find).length - 1;
    if (n !== 1) throw new Error(`${m.id}: snippet found ${n} times: ${find}`);
    mutated = mutated.replace(find, () => replace);
  }
  fs.writeFileSync(SRC, mutated);
  let red;
  try { red = run(m.name); } finally { fs.writeFileSync(SRC, original); }
  const clean = spawnSync("git", ["-C", W, "diff", "--quiet", "--", "skills/auto-capture-hermes/capture-hermes-session.mjs"]).status === 0;
  const green = run(m.name);
  results.push({ id: m.id, name: m.name, mutant: m.label, redExit: red.status, redLine: decisive(red.stdout + red.stderr), redSummary: summary(red.stdout), restoredClean: clean, greenExit: green.status, greenSummary: summary(green.stdout) });
  console.log(`${m.id}\tred=${red.status}\tgreen=${green.status}\tclean=${clean}\t${decisive(red.stdout + red.stderr).slice(0, 90)}`);
}
fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
