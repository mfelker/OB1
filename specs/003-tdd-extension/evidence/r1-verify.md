# A1: spec-kit-tdd 2.0.1 install verification

Verified 2026-11-25, research R1 / task T004–T005.

- Release asset: `tdd-2.0.1.zip` from `d0whc3r/spec-kit-tdd` release `v2.0.1`
- Zip SHA-256: `bdae2f8d6582767c47c1758ed3204d23d41b83e666e0165830720b97b7212726`
- Tag `v2.0.1` → commit `55221d428c7f135d8884df57a49108a59541a698`. This is the same commit whose files were reviewed before adoption.
- Method: every unzipped file's `git hash-object` was compared with its blob in `git/trees/v2.0.1`. All paths are within the allowed set (`extension.yml`, `README.md`, `LICENSE`, `commands/`, `templates/`).
- Installed with `specify extension add --dev <unzipped dir>`. The installed `.specify/extensions/tdd/` copies were re-hashed against the zip, and all 11 are identical.

## Zip vs tag

| File | Zip blob | Tag blob | Match |
|------|----------|----------|-------|
| `commands/speckit.tdd.plan.md` | `63980eae74e1` | `63980eae74e1` | ✅ |
| `commands/speckit.tdd.run.md` | `2f75cdb3132c` | `2f75cdb3132c` | ✅ |
| `commands/speckit.tdd.setup.md` | `16de5aaabc97` | `16de5aaabc97` | ✅ |
| `commands/speckit.tdd.verify.md` | `074492a07252` | `074492a07252` | ✅ |
| `extension.yml` | `d9574ae55bcb` | `d9574ae55bcb` | ✅ |
| `LICENSE` | `c75e1a769c36` | `c75e1a769c36` | ✅ |
| `README.md` | `601c3b06f7d5` | `601c3b06f7d5` | ✅ |
| `templates/tdd-loop-playbook.md` | `265ba5178c35` | `265ba5178c35` | ✅ |
| `templates/tdd-stack-profile.md` | `9b9ab4305e9a` | `9b9ab4305e9a` | ✅ |
| `templates/tdd-test-list-template.md` | `732853e5fba8` | `732853e5fba8` | ✅ |
| `templates/tdd-test-quality-rubric.md` | `e0ec7eb49df1` | `e0ec7eb49df1` | ✅ |

## Result

- 11/11 files match, with 0 outside the allowed set.
- Hooks registered: `after_tasks` (optional), `before_implement` (**mandatory**), `after_implement` (optional), `after_converge` (optional).
- Installer footprint: `.specify/extensions/tdd/`, `.specify/extensions/{.registry,extensions.yml}`, `.claude/skills/speckit-tdd-*`. It touched no upstream-tracked file.
- The installer-generated `.specify/extensions/tdd/.specify-dev/agent-commands/*/SKILL.md` files fail the repo's Markdown Lint. Vendored extensions are exempted with `.specify/extensions/.markdownlint-cli2.jsonc`, the same pattern as `.claude/skills/`. The full CI lint (`**/*.md`) passes: 318 files, 0 issues.
