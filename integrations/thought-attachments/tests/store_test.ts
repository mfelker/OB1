/** createSupabaseStore (T017, T018, T038, T048, T062): supabase-js over the fake fetch. No network. */
import { assertEquals } from "jsr:@std/assert@1.0.19";
import { createSupabaseStore } from "../src/store.ts";
import { loadSettings } from "../src/settings.ts";
import type { AttachmentRow, Settings, Store } from "../src/types.ts";
import { FakeFetch } from "./helpers/fake_fetch.ts";
import { envGetter, SERVICE_ROLE_KEY, SUPABASE_URL } from "./helpers/env.ts";

const REST = `${SUPABASE_URL}/rest/v1`;
const STORAGE = `${SUPABASE_URL}/storage/v1`;

function settingsWith(overrides: Record<string, string | undefined> = {}): Settings {
  const result = loadSettings(envGetter(overrides));
  if (!result.ok) throw new Error(`expected ok settings: ${JSON.stringify(result.problems)}`);
  return result.settings;
}

function setup(overrides: Record<string, string | undefined> = {}): { store: Store; ff: FakeFetch; settings: Settings } {
  const ff = new FakeFetch();
  const settings = settingsWith(overrides);
  return { store: createSupabaseStore(SUPABASE_URL, SERVICE_ROLE_KEY, settings, ff.fetch), ff, settings };
}

/** The whole row an attachment RPC or table read returns (data-model.md). */
export function attachmentRow(overrides: Partial<AttachmentRow> = {}): AttachmentRow {
  return {
    id: "11111111-2222-3333-4444-555555555555",
    parent_thought_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    parent_created_here: false,
    file_name: "manual.pdf",
    declared_type: "application/pdf",
    declared_size: 1234,
    expected_kind: null,
    actual_type: null,
    actual_size: null,
    page_count: null,
    content_hash: null,
    storage_path: "attachments/11111111-2222-3333-4444-555555555555/manual.pdf",
    sensitivity_tier: "personal",
    state: "pending_upload",
    state_reason: null,
    last_rebuild_error: null,
    caption_model: null,
    derived_count: 0,
    upload_deadline: "2026-01-01T01:00:00+00:00",
    page_token_hash: null,
    busy_op: null,
    busy_until: null,
    busy_token: null,
    created_at: "2026-01-01T00:00:00+00:00",
    updated_at: "2026-01-01T00:00:00+00:00",
    processed_at: null,
    ...overrides,
  };
}

Deno.test("U69 thoughtExists is true for an existing id and false for an unknown one", async () => {
  const { store, ff } = setup();
  ff.on("GET", `${REST}/thoughts*`, (req) => ({
    body: req.url.includes("id=eq.known-id") ? [{ id: "known-id" }] : [],
  }));
  assertEquals(await store.thoughtExists("known-id"), { data: true });
  assertEquals(await store.thoughtExists("unknown-id"), { data: false });
  assertEquals(ff.requests[0].headers["apikey"], SERVICE_ROLE_KEY);
});

Deno.test("U70 matchThoughts sends the embedding and limit to the base match_thoughts and maps the reply to ThoughtMatch", async () => {
  const { store, ff } = setup();
  const long = "x".repeat(200);
  ff.on("POST", `${REST}/rpc/match_thoughts`, {
    body: [
      { id: "t1", content: `First line\nsecond line`, metadata: {}, similarity: 0.9, created_at: "2026-02-03T04:05:06+00:00" },
      { id: "t2", content: long, metadata: {}, similarity: 0.8, created_at: "2026-02-04T00:00:00+00:00" },
    ],
  });
  const embedding = [0.1, 0.2, 0.3];
  const result = await store.matchThoughts(embedding, 5);
  assertEquals(result, {
    data: [
      { id: "t1", first_line: "First line", captured: "2026-02-03T04:05:06+00:00" },
      { id: "t2", first_line: "x".repeat(120), captured: "2026-02-04T00:00:00+00:00" },
    ],
  });
  const body = ff.requests[0].body as Record<string, unknown>;
  assertEquals(body.query_embedding, embedding);
  assertEquals(body.match_count, 5);
  assertEquals(body.match_threshold, 0);
});
