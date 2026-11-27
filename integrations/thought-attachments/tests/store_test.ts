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
