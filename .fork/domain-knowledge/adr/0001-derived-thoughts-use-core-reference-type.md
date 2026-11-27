# 0001. Derived thoughts use the core `reference` type

**Status**: accepted (2026-11-26, spec 007 grill Round 1 Q8); to be revisited by fork issue #32

Spec 007 turns PDF passages and photo captions into ordinary thoughts, and a single manual can produce dozens of them, which would crowd the core `list_thoughts` and `thought_stats`, tools that 007 cannot change. We label every derived thought with the existing core type `reference` and the topics `attachment` and the file's base name, so the owner can filter them, and we accept that the unfiltered recent listing fills up after a large upload. We rejected bigger passages, which are less precise in search, and a model-written summary thought per file, which needs an extra chat model. New kinds of thought need core changes, so they are left to a later spec (#32), which must also migrate thoughts labelled under this decision.

Related: [CONTEXT.md](../CONTEXT.md) (derived thought), [spec 007](../../../specs/007-thought-attachments/spec.md) FR-028.
