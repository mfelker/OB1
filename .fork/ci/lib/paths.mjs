// Path → contribution folder mapping (spec FR-002, FR-003; data-model Changed Folder.path/category).

export const CATEGORIES = Object.freeze([
  'recipes', 'schemas', 'integrations', 'dashboards', 'skills', 'extensions', 'primitives',
]);

const FORK_ONLY_PREFIXES = [
  '.specify/',
  'specs/',
  '.fork/',
  '.claude/skills/speckit-',
  '.github/workflows/fork-',
];

/**
 * Classify one repo-relative path.
 * @returns {{kind:'folder', folder:string, category:string} | {kind:'forkOnly'|'template'|'other'}}
 */
export function classifyPath(path) {
  if (FORK_ONLY_PREFIXES.some(p => path.startsWith(p))) return { kind: 'forkOnly' };
  const parts = path.split('/');
  if (parts[0] === 'server' && parts.length > 1) {
    return { kind: 'folder', folder: 'server', category: 'server' };
  }
  if (CATEGORIES.includes(parts[0]) && parts.length > 2) {
    if (parts[1] === '_template') return { kind: 'template' };
    return { kind: 'folder', folder: `${parts[0]}/${parts[1]}`, category: parts[0] };
  }
  return { kind: 'other' };
}

/**
 * Group changed paths into contribution folders and count skipped paths.
 * @param {string[]} paths
 * @returns {{folders: {path:string, category:string, changedFiles:string[]}[], skipped: {forkOnly:number, template:number, other:number}}}
 */
export function mapPaths(paths) {
  const byFolder = new Map();
  const skipped = { forkOnly: 0, template: 0, other: 0 };
  for (const p of paths) {
    const c = classifyPath(p);
    if (c.kind !== 'folder') {
      skipped[c.kind] += 1;
      continue;
    }
    if (!byFolder.has(c.folder)) byFolder.set(c.folder, { path: c.folder, category: c.category, changedFiles: [] });
    byFolder.get(c.folder).changedFiles.push(p);
  }
  const folders = [...byFolder.values()]
    .map(f => ({ ...f, changedFiles: [...f.changedFiles].sort() }))
    .sort((a, b) => a.path.localeCompare(b.path));
  return { folders, skipped };
}
