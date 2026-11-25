// Advisory TDD artifact status for the PR's linked feature(s) (contracts/fork-ci-tdd-status.md;
// spec 003 FR-014, research R9). Never feeds computeVerdict.

/**
 * @param {string} rootDir repo root containing specs/
 * @param {string} headRef PR head branch; empty on push events
 * @returns {null|{headRef:string, features:object[], linked:boolean, error:null}}
 */
export function tddStatus(rootDir, headRef) {
  if (!headRef) return null;
  const features = [];
  return { headRef, features, linked: features.length > 0, error: null };
}
