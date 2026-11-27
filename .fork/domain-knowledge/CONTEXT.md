# Open Brain fork: domain context

The canonical vocabulary for the owner's Open Brain fork (`mfelker/OB1`), maintained by `/speckit-grill-with-docs`. Upstream owns `docs/`, so this glossary lives in the fork-only `.fork/` tree.

## Canonical terms

- **Thought**: One row in the core `thoughts` table: a piece of text with its embedding and metadata, found through the brain's semantic search.
- **Attachment**: One stored file (a PDF or a photo) recorded against exactly one parent thought, with its file facts and processing state. _Avoid_: document, upload, asset.
- **Parent thought**: The thought an attachment belongs to: an existing thought, or a note saved when the attachment was started with note text. _Avoid_: owner thought, host thought.
- **Derived thought**: An ordinary thought created from an attachment (a PDF passage or a photo caption) and owned by exactly that one attachment. _Avoid_: chunk thought, child thought.
- **Source line**: The first line of a derived thought's text, naming the file, its page range or "photo", and the attachment id. _Avoid_: header, citation.

## Domain boundaries

- Attachments and derived thoughts extend the core `thoughts` contract without changing it: a derived thought is a normal thought that the core search finds unchanged.
- An attachment owns its derived thoughts; removing the attachment removes them and never touches its parent thought or any thought it did not create. The one exception is a note created when the attachment was started: it goes with that attachment if the attachment never succeeded (refused, or expired without an upload) and no other attachment points to the note.

## Related documents

- [Spec 007: thought attachments](../../specs/007-thought-attachments/spec.md): the feature that introduces these terms.
