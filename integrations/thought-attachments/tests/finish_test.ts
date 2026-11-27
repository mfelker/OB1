/** finish (T025, T026, T039, T040, T056, T057, T058): the finisher over FakeStore, fake_fetch and the real X and E modules. */
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1.0.19";
import { createFinisher } from "../src/finish.ts";
import { createEmbeddingClient } from "../src/embeddings.ts";
import { createVisionClient } from "../src/vision.ts";
import { loadSettings } from "../src/settings.ts";
import type { AttachmentRow, Deps, Settings } from "../src/types.ts";
import { Clock } from "./helpers/clock.ts";
import { envGetter, EMBEDDING_API_BASE, VISION_API_BASE } from "./helpers/env.ts";
import { embeddingResponder, FakeFetch, visionResponder } from "./helpers/fake_fetch.ts";
import { FakeStore, shortId } from "./helpers/fake_store.ts";
import { contentHash, jpegBytes, scannedPdf, textPdf } from "./helpers/fixtures.ts";

function settingsWith(overrides: Record<string, string | undefined> = {}): Settings {
  const result = loadSettings(envGetter(overrides));
  if (!result.ok) throw new Error("expected ok settings: " + JSON.stringify(result.problems));
  return result.settings;
}

const EMBED_URL = `${EMBEDDING_API_BASE}/embeddings`;
const VISION_URL = `${VISION_API_BASE}/chat/completions`;

interface Rig {
  clock: Clock;
  store: FakeStore;
  ff: FakeFetch;
  settings: Settings;
  deps: Deps;
  finish: ReturnType<typeof createFinisher>["finish"];
  parent: string;
}

/** A rig with a parent thought. Vectors are 1536 long unless `dimension` says otherwise. */
async function rig(overrides: Record<string, string | undefined> = {}): Promise<Rig> {
  const clock = new Clock();
  const store = new FakeStore({ clock });
  const ff = new FakeFetch()
    .on("POST", EMBED_URL, embeddingResponder())
    .on("POST", VISION_URL, visionResponder("a red door"));
  const settings = settingsWith(overrides);
  const deps: Deps = {
    settings,
    store,
    embeddings: createEmbeddingClient(settings, ff.fetch),
    vision: createVisionClient(settings, ff.fetch),
    now: clock.now,
    randomBytes: (n) => new Uint8Array(n),
  };
  const parent = (await store.seedThought({ content: "the owner's thought" })).id;
  return { clock, store, ff, settings, deps, finish: createFinisher(deps).finish, parent };
}

/** A finisher over the same store and fetch, with other settings (a newly configured model, a lowered threshold). */
function reconfigured(r: Rig, overrides: Record<string, string | undefined>): Rig["finish"] {
  const settings = settingsWith(overrides);
  return createFinisher({
    ...r.deps,
    settings,
    embeddings: createEmbeddingClient(settings, r.ff.fetch),
    vision: createVisionClient(settings, r.ff.fetch),
  }).finish;
}

/** A pending attachment with its uploaded bytes in the store. */
function pending(
  r: Rig,
  bytes: Uint8Array,
  over: Partial<AttachmentRow> = {},
  uploadedAt?: string,
): AttachmentRow {
  const isPdf = bytes[0] === 0x25;
  const name = over.file_name ?? (isPdf ? "manual.pdf" : "door.jpg");
  const row = r.store.seedAttachment({
    parent_thought_id: r.parent,
    file_name: name,
    declared_type: isPdf ? "application/pdf" : "image/jpeg",
    declared_size: bytes.length,
    expected_kind: isPdf ? "pdf" : "photo",
    storage_path: `attachments/x/${name}`,
    ...over,
  });
  r.store.putObject(row.storage_path as string, bytes, uploadedAt);
  return row;
}

Deno.test("U182 a pending PDF with a matching upload ends processed, with derived_count equal to the passage count and page_count set", async () => {
  const r = await rig();
  const att = pending(r, await textPdf(["alpha beta gamma delta epsilon zeta", "eta theta iota kappa lambda mu"]));
  const out = await r.finish(att.id, {});
  assertEquals(out.state, "processed");
  assertEquals(out.page_count, 2);
  const derived = r.store.derivedOf(att.id);
  assert(derived.length >= 1);
  assertEquals(out.derived_count, derived.length);
  assertEquals(r.store.attachment(att.id)?.state, "processed");
  assertEquals(r.store.attachment(att.id)?.page_count, 2);
});

Deno.test("U183 finishing sets actual_type, actual_size, page_count, content_hash and processed_at", async () => {
  const r = await rig();
  const bytes = await textPdf(["alpha beta gamma delta epsilon zeta", "eta theta iota kappa lambda mu"]);
  const att = pending(r, bytes);
  r.clock.advanceMinutes(5);
  await r.finish(att.id, {});
  const row = r.store.attachment(att.id) as AttachmentRow;
  assertEquals(row.actual_type, "application/pdf");
  assertEquals(row.actual_size, bytes.length);
  assertEquals(row.page_count, 2);
  assertEquals(row.content_hash, await contentHash(bytes));
  assertEquals(row.processed_at, r.clock.iso());
});

Deno.test("U184 every derived row's input_hash equals the attachment's content_hash", async () => {
  const r = await rig();
  const bytes = await textPdf(["alpha beta gamma delta epsilon zeta", "eta theta iota kappa lambda mu"]);
  const att = pending(r, bytes);
  await r.finish(att.id, {});
  const derived = r.store.derivedOf(att.id);
  assert(derived.length >= 1);
  const stored = r.store.attachment(att.id)?.content_hash;
  assertEquals(stored, await contentHash(bytes));
  for (const d of derived) assertEquals(d.metadata.input_hash, stored);
});

Deno.test("U185 after a processed finish, a new claim on the attachment succeeds at once", async () => {
  const r = await rig();
  const att = pending(r, await textPdf(["alpha beta gamma delta epsilon zeta"]));
  const out = await r.finish(att.id, {});
  assertEquals(out.state, "processed");
  const claim = await r.store.claim(att.id, "remove", 60);
  assert("data" in claim && "token" in claim.data);
});

Deno.test("U186 an owner thought equal to a passage's body is unchanged after the finish", async () => {
  const r = await rig();
  const owner = await r.store.seedThought({ content: "alpha beta gamma delta epsilon zeta", metadata: { mine: true } });
  const before = structuredClone(r.store.thought(owner.id));
  const att = pending(r, await textPdf(["alpha beta gamma delta epsilon zeta"]));
  const out = await r.finish(att.id, {});
  assertEquals(out.state, "processed");
  assertEquals(r.store.thought(owner.id), before);
  assertEquals(r.store.derivedOf(att.id).length, 1);
  assertStringIncludes(r.store.derivedOf(att.id)[0].content, "alpha beta gamma delta epsilon zeta");
});

Deno.test("U187 a plain finish on processed returns the existing outcome with no embedding or vision request and no write", async () => {
  const r = await rig();
  const att = pending(r, await textPdf(["alpha beta gamma delta epsilon zeta", "eta theta iota kappa lambda mu"]));
  const first = await r.finish(att.id, {});
  assertEquals(first.state, "processed");
  const requests = r.ff.requests.length;
  const writes = () => r.store.callNames().filter((m) => m === "writeDerived" || m === "setState").length;
  const writesBefore = writes();
  const again = await r.finish(att.id, {});
  assertEquals(again, first);
  assertEquals(r.ff.requests.length, requests);
  assertEquals(writes(), writesBefore);
});

Deno.test("U188 bytes already on another attachment of the parent end refused, naming its short id, with the copy deleted", async () => {
  const r = await rig();
  const bytes = await textPdf(["alpha beta gamma delta epsilon zeta", "eta theta iota kappa lambda mu"]);
  const first = pending(r, bytes);
  assertEquals((await r.finish(first.id, {})).state, "processed");
  const second = pending(r, bytes, { file_name: "copy.pdf" });
  const out = await r.finish(second.id, {});
  assertEquals(out.state, "refused");
  assertStringIncludes(out.reason ?? "", "already attached to this thought as " + shortId(first.id));
  const row = r.store.attachment(second.id) as AttachmentRow;
  assertEquals(row.state, "refused");
  assertEquals(row.state_reason, out.reason);
  assertEquals(r.store.objects.has(second.storage_path as string), false);
  assertEquals(r.store.derivedOf(second.id).length, 0);
  assertEquals(out.derived_count, 0);
});

Deno.test("U322 when the only attachment with those bytes is refused, the finish is not refused for them", async () => {
  const r = await rig();
  const bytes = await textPdf(["alpha beta gamma delta epsilon zeta"]);
  pending(r, bytes, { file_name: "old.pdf", state: "refused", content_hash: await contentHash(bytes) });
  const second = pending(r, bytes, { file_name: "again.pdf" });
  const out = await r.finish(second.id, {});
  assertEquals(out.state, "processed");
});

Deno.test("U323 the same bytes on an attachment of another parent don't refuse the finish", async () => {
  const r = await rig();
  const bytes = await textPdf(["alpha beta gamma delta epsilon zeta"]);
  const otherParent = (await r.store.seedThought({ content: "another thought" })).id;
  pending(r, bytes, { parent_thought_id: otherParent, file_name: "theirs.pdf", state: "processed", content_hash: await contentHash(bytes) });
  const mine = pending(r, bytes, { file_name: "mine.pdf" });
  const out = await r.finish(mine.id, {});
  assertEquals(out.state, "processed");
  assertEquals(r.store.attachment(mine.id)?.state, "processed");
});

Deno.test("U324 a first attachment with those bytes in state failed still counts: the second ends refused, naming it", async () => {
  const r = await rig();
  const bytes = await textPdf(["alpha beta gamma delta epsilon zeta"]);
  const first = pending(r, bytes, { file_name: "first.pdf", state: "failed", content_hash: await contentHash(bytes) });
  const second = pending(r, bytes, { file_name: "second.pdf" });
  const out = await r.finish(second.id, {});
  assertEquals(out.state, "refused");
  assertStringIncludes(out.reason ?? "", shortId(first.id));
});

Deno.test("U189 a photo with a caption gives one derived thought, processed, with caption_model set", async () => {
  const r = await rig();
  const att = pending(r, jpegBytes(2000));
  const out = await r.finish(att.id, {});
  assertEquals(out.state, "processed");
  assertEquals(out.derived_count, 1);
  const derived = r.store.derivedOf(att.id);
  assertEquals(derived.length, 1);
  assertStringIncludes(derived[0].content, "a red door");
  const row = r.store.attachment(att.id) as AttachmentRow;
  assertEquals(row.state, "processed");
  assertEquals(row.caption_model, "test/vision-model");
  assertEquals(row.actual_type, "image/jpeg");
});

Deno.test("U191 a 301-character caption is returned as its first 300 characters, while the derived thought keeps the full caption", async () => {
  const r = await rig();
  const caption = "abcdefghij".repeat(30) + "k";
  r.ff.on("POST", VISION_URL, visionResponder(caption));
  const att = pending(r, jpegBytes(2000));
  const out = await r.finish(att.id, {});
  assertEquals(out.caption, caption.slice(0, 300));
  assertStringIncludes(r.store.derivedOf(att.id)[0].content, caption);
});

Deno.test("U190 a 300-character caption is returned whole in the outcome", async () => {
  const r = await rig();
  const caption = "abcdefghij".repeat(30);
  r.ff.on("POST", VISION_URL, visionResponder(caption));
  const att = pending(r, jpegBytes(2000));
  const out = await r.finish(att.id, {});
  assertEquals(caption.length, 300);
  assertEquals(out.caption, caption);
});

Deno.test("U192 with vision not configured, the photo ends not_captioned with the reason, the object is kept, and there is no derived thought", async () => {
  const r = await rig({ VISION_API_BASE: undefined });
  const att = pending(r, jpegBytes(2000));
  const out = await r.finish(att.id, {});
  assertEquals(out.state, "not_captioned");
  assertStringIncludes(out.reason ?? "", "not configured");
  assertEquals(out.derived_count, 0);
  const row = r.store.attachment(att.id) as AttachmentRow;
  assertEquals(row.state, "not_captioned");
  assertEquals(row.state_reason, out.reason);
  assertEquals(r.store.objects.has(att.storage_path as string), true);
  assertEquals(r.store.derivedOf(att.id).length, 0);
  assertEquals(r.ff.requests.filter((q) => q.url === VISION_URL).length, 0);
});

Deno.test("U193 with the vision call failing, the photo ends not_captioned with the vision error's reason, and the object is kept", async () => {
  const r = await rig();
  r.ff.on("POST", VISION_URL, () => ({ status: 503, body: "vision is down" }));
  const att = pending(r, jpegBytes(2000));
  const out = await r.finish(att.id, {});
  assertEquals(out.state, "not_captioned");
  assertStringIncludes(out.reason ?? "", "503");
  assertEquals(r.store.attachment(att.id)?.state_reason, out.reason);
  assertEquals(r.store.objects.has(att.storage_path as string), true);
  assertEquals(r.store.derivedOf(att.id).length, 0);
});

Deno.test("U194 a not_captioned photo finished again with vision working ends processed with one caption", async () => {
  const r = await rig();
  r.ff.on("POST", VISION_URL, () => ({ status: 503, body: "vision is down" }));
  const att = pending(r, jpegBytes(2000));
  assertEquals((await r.finish(att.id, {})).state, "not_captioned");
  r.ff.on("POST", VISION_URL, visionResponder("a red door"));
  const out = await r.finish(att.id, {});
  assertEquals(out.state, "processed");
  assertEquals(out.derived_count, 1);
  assertEquals(r.store.derivedOf(att.id).length, 1);
  const row = r.store.attachment(att.id) as AttachmentRow;
  assertEquals(row.state, "processed");
  assertEquals(row.state_reason, null);
  assertEquals(row.caption_model, "test/vision-model");
});

Deno.test("U195 rebuild on a processed photo gives exactly one caption by the newly configured model and updates caption_model", async () => {
  const r = await rig();
  const att = pending(r, jpegBytes(2000));
  assertEquals((await r.finish(att.id, {})).state, "processed");
  r.ff.on("POST", VISION_URL, visionResponder("a blue door", "new/model"));
  const finishNew = reconfigured(r, { VISION_MODEL: "new/model" });
  const out = await finishNew(att.id, { rebuild: true });
  assertEquals(out.state, "processed");
  assertEquals(out.derived_count, 1);
  assertEquals(out.caption, "a blue door");
  const derived = r.store.derivedOf(att.id);
  assertEquals(derived.length, 1);
  assertStringIncludes(derived[0].content, "a blue door");
  assertEquals(r.store.attachment(att.id)?.caption_model, "new/model");
});

Deno.test("U196 rebuild on a processed PDF replaces the passage set, and derived_count equals the new count", async () => {
  const r = await rig();
  const words = Array.from({ length: 120 }, (_, i) => "word" + i).join(" ");
  const att = pending(r, await textPdf([words.slice(0, 400), words.slice(400, 800)]));
  const first = await r.finish(att.id, {});
  assertEquals(first.state, "processed");
  const oldIds = r.store.derivedOf(att.id).map((t) => t.id);
  const finishSmall = reconfigured(r, { PASSAGE_MAX_CHARS: "200" });
  const out = await finishSmall(att.id, { rebuild: true });
  assertEquals(out.state, "processed");
  const derived = r.store.derivedOf(att.id);
  assert(derived.length > first.derived_count);
  assertEquals(out.derived_count, derived.length);
  assertEquals(r.store.attachment(att.id)?.derived_count, derived.length);
  for (const t of derived) assertEquals(oldIds.includes(t.id), false);
});

Deno.test("U197 a failed rebuild keeps the old set and processed, and the outcome and row carry last_rebuild_error with the reason", async () => {
  const r = await rig();
  const att = pending(r, jpegBytes(2000));
  assertEquals((await r.finish(att.id, {})).state, "processed");
  const oldIds = r.store.derivedOf(att.id).map((t) => t.id);
  r.ff.on("POST", VISION_URL, () => ({ status: 503, body: "vision is down" }));
  const out = await r.finish(att.id, { rebuild: true });
  assertEquals(out.state, "processed");
  assertEquals(out.derived_count, 1);
  assertStringIncludes(out.last_rebuild_error ?? "", "503");
  const row = r.store.attachment(att.id) as AttachmentRow;
  assertEquals(row.state, "processed");
  assertEquals(row.last_rebuild_error, out.last_rebuild_error);
  assertEquals(r.store.derivedOf(att.id).map((t) => t.id), oldIds);
  assertEquals(row.caption_model, "test/vision-model");
});

Deno.test("U326 a successful rebuild after a failed one clears last_rebuild_error in the row and reports none in the outcome", async () => {
  const r = await rig();
  const att = pending(r, jpegBytes(2000));
  await r.finish(att.id, {});
  r.ff.on("POST", VISION_URL, () => ({ status: 503, body: "vision is down" }));
  const failed = await r.finish(att.id, { rebuild: true });
  assert(failed.last_rebuild_error);
  r.ff.on("POST", VISION_URL, visionResponder("a blue door"));
  const out = await r.finish(att.id, { rebuild: true });
  assertEquals(out.state, "processed");
  assertEquals(out.last_rebuild_error, undefined);
  assertEquals(r.store.attachment(att.id)?.last_rebuild_error, null);
  assertEquals(out.caption, "a blue door");
});

Deno.test("U325 finishing a failed attachment again, or rebuilding a processed one, is not refused as a duplicate of itself", async () => {
  const r = await rig();
  const bytes = await textPdf(["alpha beta gamma delta epsilon zeta"]);
  const att = pending(r, bytes, { state: "failed", state_reason: "boom", content_hash: await contentHash(bytes) });
  const again = await r.finish(att.id, {});
  assertEquals(again.state, "processed");
  const rebuilt = await r.finish(att.id, { rebuild: true });
  assertEquals(rebuilt.state, "processed");
  assertEquals(rebuilt.last_rebuild_error, undefined);
  assertEquals(r.store.objects.has(att.storage_path as string), true);
});

Deno.test("U198 when checkActual refuses, the object is deleted, the row is refused with the actual values, and no derived thought is written", async () => {
  const pdf = await textPdf(["alpha beta gamma delta epsilon zeta", "eta theta iota kappa lambda mu"]);
  const cases: { name: string; overrides: Record<string, string>; row: Partial<AttachmentRow>; bytes: Uint8Array; code: string }[] = [
    { name: "wrong type", overrides: {}, row: { declared_type: "image/jpeg" }, bytes: pdf, code: "image/jpeg" },
    { name: "wrong size", overrides: {}, row: { declared_size: 5 }, bytes: pdf, code: "not the declared 5" },
    { name: "too many pages", overrides: { MAX_PDF_PAGES: "1" }, row: {}, bytes: pdf, code: "MAX_PDF_PAGES" },
  ];
  for (const c of cases) {
    const r = await rig(c.overrides);
    const att = pending(r, c.bytes, c.row);
    const out = await r.finish(att.id, {});
    assertEquals(out.state, "refused", c.name);
    assertStringIncludes(out.reason ?? "", c.code, c.name);
    assertEquals(out.derived_count, 0, c.name);
    const row = r.store.attachment(att.id) as AttachmentRow;
    assertEquals(row.state, "refused", c.name);
    assertEquals(row.state_reason, out.reason, c.name);
    assertEquals(row.actual_type, "application/pdf", c.name);
    assertEquals(row.actual_size, c.bytes.length, c.name);
    assertEquals(r.store.objects.has(att.storage_path as string), false, c.name);
    assertEquals(r.store.derivedOf(att.id).length, 0, c.name);
  }
});

Deno.test("U199 an object created after upload_deadline is refused and deleted", async () => {
  const r = await rig();
  const bytes = await textPdf(["alpha beta gamma delta epsilon zeta"]);
  const deadline = new Date(r.clock.now().getTime() + 10 * 60_000);
  const att = pending(r, bytes, { upload_deadline: deadline.toISOString() }, new Date(deadline.getTime() + 1000).toISOString());
  r.clock.advanceMinutes(5);
  const out = await r.finish(att.id, {});
  assertEquals(out.state, "refused");
  assertStringIncludes(out.reason ?? "", "after");
  assertEquals(r.store.attachment(att.id)?.state, "refused");
  assertEquals(r.store.objects.has(att.storage_path as string), false);
  assertEquals(r.store.derivedOf(att.id).length, 0);
});

Deno.test("U200 an object created exactly at upload_deadline is not refused for its timing", async () => {
  const r = await rig();
  const bytes = await textPdf(["alpha beta gamma delta epsilon zeta"]);
  const deadline = new Date(r.clock.now().getTime() + 10 * 60_000);
  const att = pending(r, bytes, { upload_deadline: deadline.toISOString() }, deadline.toISOString());
  r.clock.advanceMinutes(5);
  const out = await r.finish(att.id, {});
  assertEquals(out.state, "processed");
});

Deno.test("U201 finishing a refused attachment is refused, and nothing changes", async () => {
  const r = await rig();
  const att = pending(r, await textPdf(["alpha beta gamma delta epsilon zeta"]), { state: "refused", state_reason: "too big" });
  const before = structuredClone(r.store.attachment(att.id));
  const callsBefore = r.store.calls.length;
  const out = await r.finish(att.id, {});
  assertEquals(out.state, "refused");
  assertStringIncludes(out.reason ?? "", "too big");
  assertEquals(out.derived_count, 0);
  assertEquals(r.store.attachment(att.id), before);
  const writes = r.store.callNames().slice(callsBefore).filter((m) =>
    ["writeDerived", "setState", "deleteObject", "download"].includes(m)
  );
  assertEquals(writes, []);
  assertEquals(r.ff.requests.length, 0);
});

Deno.test("U202 with no object before the deadline, the outcome is 'no file uploaded yet' and the state is unchanged", async () => {
  const r = await rig();
  const att = r.store.seedAttachment({
    parent_thought_id: r.parent,
    file_name: "manual.pdf",
    declared_type: "application/pdf",
    declared_size: 1000,
    storage_path: "attachments/x/manual.pdf",
  });
  const before = structuredClone(r.store.attachment(att.id));
  const out = await r.finish(att.id, {});
  assertEquals(out.state, "pending_upload");
  assertStringIncludes(out.reason ?? "", "no file uploaded yet");
  assertEquals(out.derived_count, 0);
  assertEquals(r.store.attachment(att.id), before);
});

Deno.test("U203 with no object after the deadline, the outcome is 'upload window expired' and the state is unchanged", async () => {
  const r = await rig();
  const att = r.store.seedAttachment({
    parent_thought_id: r.parent,
    file_name: "manual.pdf",
    declared_type: "application/pdf",
    declared_size: 1000,
    storage_path: "attachments/x/manual.pdf",
  });
  r.clock.set(new Date(new Date(att.upload_deadline).getTime() + 1000));
  const before = structuredClone(r.store.attachment(att.id));
  const out = await r.finish(att.id, {});
  assertEquals(out.state, "pending_upload");
  assertStringIncludes(out.reason ?? "", "upload window expired");
  assertEquals(r.store.attachment(att.id), before);
});

Deno.test("U204 after a refused or no-file outcome, a new claim succeeds at once", async () => {
  const r = await rig();
  const refused = pending(r, await textPdf(["alpha beta gamma delta epsilon zeta"]), { declared_size: 5 });
  assertEquals((await r.finish(refused.id, {})).state, "refused");
  const claimRefused = await r.store.claim(refused.id, "remove", 60);
  assert("data" in claimRefused && "token" in claimRefused.data);
  const none = r.store.seedAttachment({
    parent_thought_id: r.parent,
    file_name: "later.pdf",
    declared_type: "application/pdf",
    declared_size: 1000,
    storage_path: "attachments/y/later.pdf",
  });
  assertEquals((await r.finish(none.id, {})).state, "pending_upload");
  const claimNone = await r.store.claim(none.id, "finish", 60);
  assert("data" in claimNone && "token" in claimNone.data);
});

Deno.test("U205 a text-less PDF ends scanned with the reason and 'text search won't cover it yet', no passages, and the object kept", async () => {
  const r = await rig();
  const att = pending(r, await scannedPdf(2));
  const out = await r.finish(att.id, {});
  assertEquals(out.state, "scanned");
  assertStringIncludes(out.reason ?? "", "text search won't cover it yet");
  assertEquals(out.derived_count, 0);
  assertEquals(out.page_count, 2);
  const row = r.store.attachment(att.id) as AttachmentRow;
  assertEquals(row.state, "scanned");
  assertEquals(row.state_reason, out.reason);
  assertEquals(row.page_count, 2);
  assertEquals(r.store.derivedOf(att.id).length, 0);
  assertEquals(r.store.objects.has(att.storage_path as string), true);
  assertEquals(r.ff.requests.length, 0);
});

Deno.test("U206 a scanned PDF finished again after SCANNED_MIN_CHARS_PER_PAGE is lowered below its text ends processed", async () => {
  const r = await rig({ SCANNED_MIN_CHARS_PER_PAGE: "50" });
  const att = pending(r, await textPdf(["delta epsilon", "zeta eta theta"]));
  assertEquals((await r.finish(att.id, {})).state, "scanned");
  const lowered = reconfigured(r, { SCANNED_MIN_CHARS_PER_PAGE: "5" });
  const out = await lowered(att.id, {});
  assertEquals(out.state, "processed");
  assert(out.derived_count >= 1);
  const row = r.store.attachment(att.id) as AttachmentRow;
  assertEquals(row.state, "processed");
  assertEquals(row.state_reason, null);
  assertEquals(row.derived_count, out.derived_count);
});
