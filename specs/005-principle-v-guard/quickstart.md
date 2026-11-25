# Quickstart: validate the Principle V guard

Run from the fork-`main` checkout after the feature merges. Contracts: [rule.md](contracts/rule.md), [guards.md](contracts/guards.md).

## 1. Suite

`node --test .fork/ci/test/` → all pass, including `principle-v.test.mjs` and `principle-v-guard.test.mjs`.

## 2. Agent guard by hand

```sh
G=".fork/ci/bin/principle-v-guard.mjs"
echo '{"hook_event_name":"PreToolUse","tool_name":"Write","cwd":"'"$PWD"'","tool_input":{"file_path":"'"$PWD"'/docs/domain_knowledge/CONTEXT.md"}}' | node $G --hook
echo '{"hook_event_name":"PreToolUse","tool_name":"Edit","cwd":"'"$PWD"'","tool_input":{"file_path":"'"$PWD"'/.fork/README.md"}}' | node $G --hook
echo 'not json' | node $G --hook
```

Expected: the first prints a deny naming `.fork/domain-knowledge/`; the second prints nothing; the third prints a deny starting `principle-v-guard failed:`. Each exits 0.

## 3. Commit guard

```sh
git config core.hooksPath .fork/githooks
echo x >> CODE_OF_CONDUCT.md && git add CODE_OF_CONDUCT.md && git commit -m probe   # refused, lists the file
git restore --staged CODE_OF_CONDUCT.md && git checkout -- CODE_OF_CONDUCT.md
```

## 4. Live Claude Code check (once)

In a new session in the fork-`main` checkout, ask Claude to create `docs/domain_knowledge/CONTEXT.md`. Expected: the write is refused with the `.fork/domain-knowledge/` suggestion and Claude writes there instead. To confirm the `MultiEdit`/`NotebookEdit` input fields (R1), temporarily log the hook's stdin to a scratch file, trigger each tool once, then remove the logging.

## 5. Cost

Time `node $G --hook` for an allowed path; expect well under a second (R4).
