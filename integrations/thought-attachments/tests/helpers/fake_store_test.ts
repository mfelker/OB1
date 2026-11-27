/**
 * Fake-store self-tests (T011). The fake re-implements the database rules that
 * the acceptance tests rely on (data-model.md, R9, R10, R16, R17), so each rule
 * gets its own test here. Stream Q asserts the same rules against real SQL.
 */
import { assertEquals } from "jsr:@std/assert@1.0.19";
import type { AttachmentRow, DerivedRow, R } from "../../src/types.ts";
import { Clock } from "./clock.ts";
import { vectorFor } from "./fake_fetch.ts";
import { FakeStore, fingerprintOf } from "./fake_store.ts";

/** The data of an `R`, or a thrown error naming what failed. */
function data<T>(result: R<T>): T {
  if ("error" in result) throw new Error(`expected data, got error: ${result.error}`);
  return result.data;
}

/** A store with one owner thought and one attachment on it, ready to finish. */
async function setup() {
  const clock = new Clock();
  const store = new FakeStore({ clock });
  const parent = await store.seedThought({
    content: "Dishwasher DW-500, bought in 2024",
    embedding: vectorFor("parent"),
  });
  const att = store.seedAttachment({
    parent_thought_id: parent.id,
    file_name: "manual.pdf",
    declared_type: "application/pdf",
    declared_size: 2048,
    storage_path: "attachments/a/manual.pdf",
  });
  return { clock, store, parent, att };
}

/** A derived row for `content`, with its fingerprint and a vector of the fake's dimension. */
async function derivedRow(content: string): Promise<DerivedRow> {
  return {
    content,
    fingerprint: await fingerprintOf(content),
    metadata: { type: "reference" },
    embedding: vectorFor(content),
  };
}

const BUSY_SECONDS = 410;

Deno.test("U25 a claim while another unexpired claim exists returns busy naming the holder's operation", async () => {
  const { store, clock, att } = await setup();
  data(await store.claim(att.id, "finish", BUSY_SECONDS));
  clock.advanceSeconds(BUSY_SECONDS - 1);
  assertEquals(data(await store.claim(att.id, "remove", BUSY_SECONDS)), { busy: "finish" });
});

Deno.test("U26 a claim after the holder's expiry by the injected clock succeeds with a new token", async () => {
  const { store, clock, att } = await setup();
  const first = data(await store.claim(att.id, "finish", BUSY_SECONDS)) as { token: string };
  clock.advanceSeconds(BUSY_SECONDS);
  const second = data(await store.claim(att.id, "finish", BUSY_SECONDS));
  assertEquals("token" in second && second.token !== first.token, true, `got ${JSON.stringify(second)}`);
});

Deno.test("U27 writeDerived or setState with a stale or foreign claim token returns an error and changes nothing", async () => {
  const { store, clock, att } = await setup();
  const { token } = data(await store.claim(att.id, "finish", BUSY_SECONDS)) as { token: string };
  const before = structuredClone({ thoughts: store.thoughts, attachments: store.attachments });
  const rows = [await derivedRow(`From manual.pdf, page 1 (attachment ${att.id.slice(0, 8)})\nStep one.`)];
  const foreign = await store.writeDerived(att.id, "claim-not-mine", rows, { state: "processed" });
  const foreignState = await store.setState(att.id, "claim-not-mine", { state: "failed" });
  clock.advanceSeconds(BUSY_SECONDS);
  const stale = await store.writeDerived(att.id, token, rows, { state: "processed" });
  const staleState = await store.setState(att.id, token, { state: "failed" });
  assertEquals(
    {
      errors: [foreign, foreignState, stale, staleState].map((r) => "error" in r),
      thoughts: store.thoughts,
      attachments: store.attachments,
    },
    { errors: [true, true, true, true], ...before },
  );
});

Deno.test("U28 writeDerived failing partway leaves the previous derived set and state unchanged", async () => {
  const { store, att } = await setup();
  const line = (n: number) => `From manual.pdf, page ${n} (attachment ${att.id.slice(0, 8)})\nStep ${n}.`;
  const { token } = data(await store.claim(att.id, "finish", BUSY_SECONDS)) as { token: string };
  data(
    await store.writeDerived(att.id, token, [await derivedRow(line(1)), await derivedRow(line(2))], {
      state: "processed",
    }),
  );
  const before = structuredClone({ thoughts: store.thoughts, attachments: store.attachments });
  store.failDerivedAfter = 1;
  const rebuilt = [await derivedRow(line(3)), await derivedRow(line(4)), await derivedRow(line(5))];
  const result = await store.writeDerived(att.id, token, rebuilt, { state: "processed", caption_model: "new" });
  assertEquals({ failed: "error" in result, thoughts: store.thoughts, attachments: store.attachments }, {
    failed: true,
    ...before,
  });
});

Deno.test("U29 a writeDerived row whose fingerprint equals an existing thought's returns an error and leaves that thought unchanged", async () => {
  const { store, att } = await setup();
  const body = `From manual.pdf, page 1 (attachment ${att.id.slice(0, 8)})\nTo clean the filter, twist it.`;
  // The owner's thought differs only in case and spacing, so upsert_thought's normalisation makes it the same fingerprint.
  const owner = await store.seedThought({
    content: `  ${body.toUpperCase().replace(" ", "   ")}  `,
    metadata: { by: "owner" },
  });
  const ownerBefore = structuredClone(owner);
  const { token } = data(await store.claim(att.id, "finish", BUSY_SECONDS)) as { token: string };
  const result = await store.writeDerived(att.id, token, [await derivedRow(body)], { state: "processed" });
  assertEquals(
    { failed: "error" in result, owner: store.thought(owner.id), derived: store.derivedOf(att.id).length },
    { failed: true, owner: ownerBefore, derived: 0 },
  );
});

/** Finishes `row` with one derived thought per text, under a fresh claim that is then released. */
async function finishWith(store: FakeStore, row: AttachmentRow, texts: string[]): Promise<void> {
  const { token } = data(await store.claim(row.id, "finish", BUSY_SECONDS)) as { token: string };
  const rows = await Promise.all(
    texts.map((t) => derivedRow(`From ${row.file_name}, photo (attachment ${row.id.slice(0, 8)})\n${t}`)),
  );
  data(await store.writeDerived(row.id, token, rows, { state: "processed" }));
  data(await store.release(row.id, token));
}

Deno.test("U30 removeAttachment removes only that attachment's derived thoughts and its row", async () => {
  const { store, parent, att } = await setup();
  const other = store.seedAttachment({
    parent_thought_id: parent.id,
    file_name: "shelf.jpg",
    declared_type: "image/jpeg",
  });
  await finishWith(store, att, ["Page one.", "Page two."]);
  await finishWith(store, other, ["A grey shelf."]);
  await store.seedThought({ content: "Buy furnace filters" }); // an owner thought, kept with the rest
  const keep = structuredClone({
    other: store.attachment(other.id),
    thoughts: store.thoughts.filter((t) => t.attachment_id !== att.id),
  });
  const { token } = data(await store.claim(att.id, "remove", BUSY_SECONDS)) as { token: string };
  const removed = data(await store.removeAttachment(att.id, token));
  assertEquals(
    { removed, gone: store.attachment(att.id), other: store.attachment(other.id), thoughts: store.thoughts },
    { removed: { derived: 2, noteRemoved: false }, gone: undefined, ...keep },
  );
});

Deno.test("U31 removeAttachment removes the parent note only under FR-016's exception", async () => {
  /** Removes one attachment on a fresh note; returns whether the note went and whether it is still stored. */
  async function removeOn(opts: { createdHere: boolean; state: AttachmentRow["state"]; sibling: boolean }) {
    const store = new FakeStore({ clock: new Clock() });
    const note = await store.seedThought({ content: "Photo of the garage shelf" });
    const row = store.seedAttachment({
      parent_thought_id: note.id,
      parent_created_here: opts.createdHere,
      state: opts.state,
    });
    if (opts.sibling) store.seedAttachment({ parent_thought_id: note.id, state: "processed" });
    const { token } = data(await store.claim(row.id, "remove", BUSY_SECONDS)) as { token: string };
    const { noteRemoved } = data(await store.removeAttachment(row.id, token));
    return { noteRemoved, noteStored: store.thought(note.id) !== undefined };
  }
  assertEquals(
    [
      await removeOn({ createdHere: true, state: "refused", sibling: false }),
      await removeOn({ createdHere: true, state: "processed", sibling: false }),
      await removeOn({ createdHere: true, state: "refused", sibling: true }),
      await removeOn({ createdHere: false, state: "refused", sibling: false }),
    ],
    [
      { noteRemoved: true, noteStored: false },
      { noteRemoved: false, noteStored: true },
      { noteRemoved: false, noteStored: true },
      { noteRemoved: false, noteStored: true },
    ],
  );
});

Deno.test("U32 orphans lists a row whose parent is gone, an expired pending_upload row and a refused row, each with why", async () => {
  const { store, clock, parent, att } = await setup();
  const deadline = (minutes: number) => new Date(clock.now().getTime() + minutes * 60_000).toISOString();
  const gone = store.seedAttachment({ parent_thought_id: "00000000-0000-4000-9000-00000000dead", state: "processed" });
  const expired = store.seedAttachment({ parent_thought_id: parent.id, upload_deadline: deadline(-1) });
  const refused = store.seedAttachment({ parent_thought_id: parent.id, state: "refused" });
  store.seedAttachment({ parent_thought_id: parent.id, upload_deadline: deadline(1) }); // still pending: not an orphan
  void att; // pending with the default 60-minute deadline: not an orphan
  const listed = data(await store.orphans(clock.now())).map(({ row, why }) => ({ id: row.id, why }));
  assertEquals(listed, [
    { id: gone.id, why: "parent_gone" },
    { id: expired.id, why: "upload_expired" },
    { id: refused.id, why: "refused" },
  ]);
});

Deno.test("U33 insertNote with a fingerprint that already exists returns that thought's id with created false and leaves it unchanged", async () => {
  const { store, parent } = await setup();
  const before = structuredClone(parent);
  const count = store.thoughts.length;
  const result = data(
    await store.insertNote("dishwasher dw-500,   bought in 2024 ", vectorFor("note"), { type: "observation" }),
  );
  assertEquals({ result, parent: store.thought(parent.id), count: store.thoughts.length }, {
    result: { id: parent.id, created: false },
    parent: before,
    count,
  });
});

/** A pending_upload for manual.pdf on `parent` whose deadline is `seconds` from now. */
function pendingDueIn(store: FakeStore, clock: Clock, parent: string, seconds: number): AttachmentRow {
  return store.seedAttachment({
    parent_thought_id: parent,
    file_name: "manual.pdf",
    declared_type: "application/pdf",
    declared_size: 4096,
    upload_deadline: new Date(clock.now().getTime() + seconds * 1000).toISOString(),
  });
}

Deno.test("U311 findPending returns a matching pending_upload whose deadline is one second after now", async () => {
  const clock = new Clock();
  const store = new FakeStore({ clock });
  const parent = await store.seedThought({ content: "Dishwasher DW-500" });
  const row = pendingDueIn(store, clock, parent.id, 1);
  const found = data(await store.findPending(parent.id, "manual.pdf", "application/pdf", 4096, clock.now()));
  assertEquals(found?.id, row.id);
});

Deno.test("U312 findPending returns null for such a row whose deadline is one second before now", async () => {
  const clock = new Clock();
  const store = new FakeStore({ clock });
  const parent = await store.seedThought({ content: "Dishwasher DW-500" });
  pendingDueIn(store, clock, parent.id, -1);
  assertEquals(data(await store.findPending(parent.id, "manual.pdf", "application/pdf", 4096, clock.now())), null);
});

Deno.test("U313 findByHash returns a non-refused attachment on that parent with that hash, and null when the only match is refused or on another parent", async () => {
  const store = new FakeStore({ clock: new Clock() });
  const parent = await store.seedThought({ content: "Dishwasher DW-500" });
  const otherParent = await store.seedThought({ content: "Garage shelf" });
  const hash = "sha256:" + "ab".repeat(32);
  const lonely = "sha256:" + "cd".repeat(32);
  const kept = store.seedAttachment({ parent_thought_id: parent.id, content_hash: hash, state: "processed" });
  store.seedAttachment({ parent_thought_id: parent.id, content_hash: lonely, state: "refused" });
  store.seedAttachment({ parent_thought_id: otherParent.id, content_hash: lonely, state: "processed" });
  assertEquals(
    [
      (data(await store.findByHash(parent.id, hash)))?.id,
      data(await store.findByHash(parent.id, lonely)),
    ],
    [kept.id, null],
  );
});
