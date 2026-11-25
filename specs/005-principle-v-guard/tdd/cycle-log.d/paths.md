## Cycle: U12 repoRelative: relative, absolute and .. forms agree

- test: `.fork/ci/test/principle-v-paths.test.mjs::U12 repoRelative: relative, absolute and .. forms agree` (new)
- red: `node --test --test-name-pattern="^U12 " .fork/ci/test/principle-v-paths.test.mjs`
  -> `actual: null, expected: 'docs/a.md'` (1 failed)
- green: `.fork/ci/lib/principle-v-paths.mjs:14` repoRelative takes root from `git rev-parse --show-toplevel` of cwd and returns the POSIX path relative to it. Suite `node --test .fork/ci/test/` -> 153 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U13 repoRelative: root is the git top-level of the path's own checkout

- test: `.fork/ci/test/principle-v-paths.test.mjs::U13 repoRelative: root is the git top-level of the path's own checkout` (new)
- red: `node --test --test-name-pattern="^U13 " .fork/ci/test/principle-v-paths.test.mjs`
  -> `+ relPath: '../fork-ci-wt-fFPALK/wt/docs/a.md'` vs expected `relPath: 'docs/a.md'` (1 failed)
- green: `.fork/ci/lib/principle-v-paths.mjs:13-14` root now comes from `git rev-parse --show-toplevel` run in the path's own directory (`dirname` of the resolved path), not `cwd`. Suite `node --test .fork/ci/test/` -> 154 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U14 repoRelative: a path through a symlinked directory matches the real path

- test: `.fork/ci/test/principle-v-paths.test.mjs::U14 repoRelative: a path through a symlinked directory matches the real path` (new)
- red: `node --test --test-name-pattern="^U14 " .fork/ci/test/principle-v-paths.test.mjs`
  -> `+ relPath: '../fork-ci-cmfpdr/viaLink/a.md'` vs expected `relPath: 'docs/a.md'` (1 failed)
- green: `.fork/ci/lib/principle-v-paths.mjs:15-16` the resolved path's directory goes through `realpathSync` before the root and relative path are computed. Suite `node --test .fork/ci/test/` -> 155 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U15 repoRelative: a file not yet created resolves through its nearest existing ancestor

- test: `.fork/ci/test/principle-v-paths.test.mjs::U15 repoRelative: a file not yet created resolves through its nearest existing ancestor` (new)
- red: `node --test --test-name-pattern="^U15 " .fork/ci/test/principle-v-paths.test.mjs`
  -> `Error: ENOENT: no such file or directory, lstat '<tmp>/fork-ci-ePcXfR/docs/new'` (1 failed; the call throws instead of returning the path)
- green: `.fork/ci/lib/principle-v-paths.mjs:15-24` walk up to the nearest existing ancestor, realpath it, append the missing tail; git root is read from that directory. Suite `node --test .fork/ci/test/` -> 156 passed, 0 failed
- refactor: none needed
- commit: (this commit)
