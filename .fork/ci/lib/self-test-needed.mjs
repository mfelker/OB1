// Does this change touch fork-ci itself? (research R13; FR-003 skips fork-only paths for
// contribution testing, so fork-ci's own tests need this separate trigger.)
export function selfTestNeeded(paths) {
  return paths.some(p => p.startsWith('.fork/ci/') || p === '.github/workflows/fork-ci.yml');
}
