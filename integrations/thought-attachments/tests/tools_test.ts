/** tools (T027-T030, T041, T049, T050, T063, T064): contracts/mcp-tools.md, driven through the MCP client over an in-memory transport. */
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1.0.19";
import { buildServer } from "../src/tools.ts";
import { loadSettings } from "../src/settings.ts";
import type { EmbeddingClient, FinishOutcome, R, Services, Settings } from "../src/types.ts";
import { Clock } from "./helpers/clock.ts";
import { envGetter } from "./helpers/env.ts";
import { FakeStore } from "./helpers/fake_store.ts";
import { inMemoryClient } from "./helpers/mcp.ts";

const DIM = 4;
const VEC = [1, 0, 0, 0];

class FakeEmbeddings implements EmbeddingClient {
  calls: string[][] = [];
  error: string | null = null;
  vector = VEC;
  embed(texts: string[]): Promise<R<number[][]>> {
    this.calls.push(texts);
    if (this.error !== null) return Promise.resolve({ error: this.error });
    return Promise.resolve({ data: texts.map(() => [...this.vector]) });
  }
}

class ScriptedFinish {
  calls: { id: string; opts: { rebuild?: boolean } }[] = [];
  outcome: FinishOutcome = { state: "processed", derived_count: 0 };
  finish: Services["finish"] = (id, opts) => {
    this.calls.push({ id, opts });
    return Promise.resolve(this.outcome);
  };
}

function settingsWith(overrides: Record<string, string | undefined> = {}): Settings {
  const result = loadSettings(envGetter(overrides));
  if (!result.ok) throw new Error("bad settings: " + JSON.stringify(result.problems));
  return result.settings;
}

async function harness(overrides: Record<string, string | undefined> = {}) {
  const clock = new Clock();
  const store = new FakeStore({ clock, dimension: DIM });
  const embeddings = new FakeEmbeddings();
  const finish = new ScriptedFinish();
  const settings = settingsWith(overrides);
  const server = buildServer(
    {
      settings,
      store,
      embeddings,
      vision: { configured: false, caption: () => Promise.resolve({ error: "none" }) },
      now: clock.now,
      randomBytes: (n) => crypto.getRandomValues(new Uint8Array(n)),
    },
    { finish: finish.finish },
  );
  const client = await inMemoryClient(server);
  return { clock, store, embeddings, finish, settings, client };
}

type H = Awaited<ReturnType<typeof harness>>;

async function call(h: H, name: string, args: Record<string, unknown> = {}) {
  const result = await h.client.callTool({ name, arguments: args });
  const content = result.content as { type: string; text: string }[];
  return {
    text: content.map((c) => c.text).join("\n"),
    data: (result.structuredContent ?? {}) as Record<string, unknown>,
    isError: result.isError === true,
  };
}

const TOOL_NAMES = [
  "attach_file",
  "find_orphan_attachments",
  "find_thought",
  "finish_attachment",
  "get_attachment",
  "list_attachments",
  "remove_attachment",
];

Deno.test("U217 tools/list returns exactly the seven tool names", async () => {
  const h = await harness();
  const { tools } = await h.client.listTools();
  assertEquals(tools.map((t) => t.name).sort(), TOOL_NAMES);
});

Deno.test("U218 each tool's readOnlyHint, destructiveHint and openWorldHint match the contract", async () => {
  const h = await harness();
  const { tools } = await h.client.listTools();
  const hints = (name: string) => tools.find((t) => t.name === name)?.annotations;
  for (const readOnly of ["find_thought", "get_attachment", "list_attachments", "find_orphan_attachments"]) {
    assertEquals(hints(readOnly)?.readOnlyHint, true, readOnly);
  }
  const attach = hints("attach_file");
  assertEquals([attach?.readOnlyHint, attach?.destructiveHint, attach?.openWorldHint], [false, false, true]);
  const finish = hints("finish_attachment");
  assertEquals([finish?.readOnlyHint, finish?.destructiveHint, finish?.openWorldHint], [false, true, true]);
  const remove = hints("remove_attachment");
  assertEquals([remove?.readOnlyHint, remove?.destructiveHint, remove?.openWorldHint], [false, true, false]);
});
