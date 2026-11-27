/** The composed app (T031, T045): key check, CORS and Accept as the core server, settings errors, routing. */
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1.0.19";
import { createApp } from "../src/app.ts";
import { loadSettings } from "../src/settings.ts";
import type { Deps, FetchApp } from "../src/types.ts";
import { Clock } from "./helpers/clock.ts";
import { BRAIN_KEY, envGetter } from "./helpers/env.ts";
import { FakeStore } from "./helpers/fake_store.ts";
import { FUNCTION_URL, mcpCall } from "./helpers/mcp.ts";

const INIT = {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: { name: "app-test", version: "1.0.0" },
};

function rig(env: Record<string, string | undefined> = {}): { app: FetchApp; store: FakeStore; deps: Deps } {
  const loaded = loadSettings(envGetter(env));
  if (!loaded.ok) throw new Error("test setup: settings");
  const store = new FakeStore({ clock: new Clock() });
  const deps: Deps = {
    settings: loaded.settings,
    store,
    embeddings: { embed: () => Promise.resolve({ error: "unused" }) },
    vision: { configured: false, caption: () => Promise.resolve({ error: "unused" }) },
    now: store.clock.now,
    randomBytes: (n) => new Uint8Array(n).fill(7),
  };
  return { app: createApp({ ok: true, deps }), store, deps };
}

Deno.test("U293 the correct key in x-brain-key lets an MCP initialize succeed", async () => {
  const { app } = rig();
  const { message } = await mcpCall(app.fetch, "initialize", INIT, BRAIN_KEY);
  assertEquals((message?.result as { serverInfo?: { name?: string } })?.serverInfo?.name !== undefined, true);
  assertEquals(message?.error, undefined);
});

Deno.test("U294 the correct key as ?key= lets an MCP initialize succeed", async () => {
  const { app } = rig();
  const { message } = await mcpCall(app.fetch, "initialize", INIT, BRAIN_KEY, { via: "query" });
  assertEquals(message?.error, undefined);
  assert((message?.result as { serverInfo?: unknown })?.serverInfo !== undefined, "no serverInfo");
});
