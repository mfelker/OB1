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
import { FakeStore } from "./helpers/fake_store.ts";
import { contentHash, textPdf } from "./helpers/fixtures.ts";

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
  const att = pending(r, await textPdf(["alpha beta gamma", "delta epsilon"]));
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
  const bytes = await textPdf(["alpha beta gamma", "delta epsilon"]);
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
  const bytes = await textPdf(["alpha beta gamma", "delta epsilon"]);
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
  const att = pending(r, await textPdf(["alpha beta gamma"]));
  const out = await r.finish(att.id, {});
  assertEquals(out.state, "processed");
  const claim = await r.store.claim(att.id, "remove", 60);
  assert("data" in claim && "token" in claim.data);
});
