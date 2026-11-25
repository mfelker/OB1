// Does this change touch fork-ci itself? (research R13; FR-003 skips fork-only paths for
// contribution testing, so fork-ci's own tests need this separate trigger.)
// Spec 003 (U36): the TDD drift and docs tests live in fork-ci's suite, so the files they
// check also trigger it.
const PREFIXES = ['.fork/ci/', '.specify/templates/overrides/', '.specify/extensions/tdd/'];
const EXACT = new Set(['.github/workflows/fork-ci.yml', '.specify/memory/constitution.md', '.fork/README.md']);

export function selfTestNeeded(paths) {
  return paths.some(p => PREFIXES.some(pre => p.startsWith(pre)) || EXACT.has(p));
}
