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
  const parent = await store.seedThought({ content: "Dishwasher DW-500, bought in 2024", embedding: vectorFor("parent") });
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
  return { content, fingerprint: await fingerprintOf(content), metadata: { type: "reference" }, embedding: vectorFor(content) };
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
  data(await store.writeDerived(att.id, token, [await derivedRow(line(1)), await derivedRow(line(2))], { state: "processed" }));
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
  const owner = await store.seedThought({ content: `  ${body.toUpperCase().replace(" ", "   ")}  `, metadata: { by: "owner" } });
  const ownerBefore = structuredClone(owner);
  const { token } = data(await store.claim(att.id, "finish", BUSY_SECONDS)) as { token: string };
  const result = await store.writeDerived(att.id, token, [await derivedRow(body)], { state: "processed" });
  assertEquals(
    { failed: "error" in result, owner: store.thought(owner.id), derived: store.derivedOf(att.id).length },
    { failed: true, owner: ownerBefore, derived: 0 },
  );
});
