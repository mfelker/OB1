// Place a fixture as <root>/<category>/<name> inside a fresh temp "repo root".
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fixtureFiles } from '../fixtures.mjs';

export function setupFolder(fixtureName, folderPath = 'recipes/fx') {
  const root = mkdtempSync(join(tmpdir(), 'fork-ci-root-'));
  for (const [rel, content] of Object.entries(fixtureFiles(fixtureName, folderPath))) {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return { root, path: folderPath, abs: join(root, folderPath) };
}
