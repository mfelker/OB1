/**
 * Harness proof (T010): the test harness works under fork-ci's exact flags
 * (--node-modules-dir=none --no-prompt --allow-env --allow-read, no network)
 * before any stream builds on it. Test names start with `H<n> ` so
 * `--filter "/^H<n> /"` selects exactly one.
 */
import { assert, assertEquals, assertRejects } from "jsr:@std/assert@1.0.19";
import { encodeHex } from "jsr:@std/encoding@1.0.11";
import { Hono } from "npm:hono@4.9.2";
import { StreamableHTTPTransport } from "npm:@hono/mcp@0.1.1";
import { McpServer } from "npm:@modelcontextprotocol/sdk@1.24.3/server/mcp.js";
import { Client } from "npm:@modelcontextprotocol/sdk@1.24.3/client/index.js";
import { InMemoryTransport } from "npm:@modelcontextprotocol/sdk@1.24.3/inMemory.js";
import { z } from "npm:zod@4.1.13";
import { createClient } from "npm:@supabase/supabase-js@2.47.10";
import { extractText, getDocumentProxy } from "npm:unpdf@2.2.2";
import { PDFDocument } from "npm:pdf-lib@1.17.1";
import { FakeFetch } from "./fake_fetch.ts";
import { textPdf } from "./fixtures.ts";
import { inMemoryClient, mcpCall } from "./mcp.ts";

function echoServer(): McpServer {
  const server = new McpServer({ name: "harness", version: "0.0.0" });
  server.registerTool(
    "echo",
    { title: "Echo", description: "Echo the input", inputSchema: { text: z.string() } },
    ({ text }) => ({ content: [{ type: "text" as const, text: `echo: ${text}` }] }),
  );
  return server;
}

/** One fresh server and transport per request, as in core and spec 004. */
function echoApp(): Hono {
  const app = new Hono();
  app.all("*", async (c) => {
    const server = echoServer();
    const transport = new StreamableHTTPTransport();
    await server.connect(transport);
    return (await transport.handleRequest(c)) ?? c.text("no response", 500);
  });
  return app;
}

Deno.test("H1 every npm and jsr import loads", () => {
  for (const [name, value] of Object.entries({
    assert,
    encodeHex,
    Hono,
    StreamableHTTPTransport,
    McpServer,
    Client,
    InMemoryTransport,
    "z.string": z.string,
    createClient,
    extractText,
    getDocumentProxy,
    PDFDocument,
  })) {
    assertEquals(typeof value, "function", name);
  }
});

Deno.test("H2 unpdf reads the page count and per-page text of a pdf-lib 3-page PDF", async () => {
  const bytes = await textPdf(["Alpha page one", "Bravo page two", "Charlie page three"]);
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  assertEquals(pdf.numPages, 3);
  const { totalPages, text } = await extractText(pdf, { mergePages: false });
  assertEquals(totalPages, 3);
  assertEquals(text.map((t) => t.trim()), ["Alpha page one", "Bravo page two", "Charlie page three"]);
});

Deno.test("H3 crypto.subtle computes the SHA-256 of a buffer", async () => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("abc"));
  assertEquals(encodeHex(new Uint8Array(digest)), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

Deno.test("H4 supabase-js with an injected fetch sends an RPC and a Storage createSignedUploadUrl to the fake", async () => {
  const base = "http://supabase.internal:8000";
  const fake = new FakeFetch()
    .on("POST", `${base}/rest/v1/rpc/embedding_dimension`, { status: 200, body: 1536 })
    .on("POST", `${base}/storage/v1/object/upload/sign/ob1-files/attachments/a1/manual.pdf`, {
      status: 200,
      body: { url: "/object/upload/sign/ob1-files/attachments/a1/manual.pdf?token=up-token" },
    });
  const sb = createClient(base, "test-service-role-key-placeholder", {
    global: { fetch: fake.fetch },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const rpc = await sb.rpc("embedding_dimension", { p_table: "thoughts" });
  assertEquals(rpc.error, null);
  assertEquals(rpc.data, 1536);

  const up = await sb.storage.from("ob1-files").createSignedUploadUrl("attachments/a1/manual.pdf");
  assertEquals(up.error, null);
  assertEquals(up.data?.token, "up-token");
  assert(up.data?.signedUrl.startsWith(`${base}/storage/v1/object/upload/sign/ob1-files/attachments/a1/manual.pdf`));

  assertEquals(fake.unmatched, []);
  assertEquals(fake.requests.map((r) => [r.method, r.url.split("?")[0]]), [
    ["POST", `${base}/rest/v1/rpc/embedding_dimension`],
    ["POST", `${base}/storage/v1/object/upload/sign/ob1-files/attachments/a1/manual.pdf`],
  ]);
  assertEquals(fake.requests[0].body, { p_table: "thoughts" });
  assertEquals(fake.requests[0].headers["apikey"], "test-service-role-key-placeholder");
});

Deno.test("H5 an McpServer behind Hono and StreamableHTTPTransport answers initialize, tools/list and tools/call through app.fetch; inMemoryClient lists the same tool", async () => {
  const app = echoApp();
  const init = await mcpCall(app.fetch, "initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "t", version: "1" },
  });
  assertEquals(init.status, 200);
  assertEquals((init.message?.result as { serverInfo: { name: string } }).serverInfo.name, "harness");

  const list = await mcpCall(app.fetch, "tools/list");
  const httpTools = (list.message?.result as { tools: { name: string }[] }).tools.map((t) => t.name);
  assertEquals(httpTools, ["echo"]);

  const call = await mcpCall(app.fetch, "tools/call", { name: "echo", arguments: { text: "hi" } });
  assertEquals((call.message?.result as { content: { text: string }[] }).content[0].text, "echo: hi");

  const client = await inMemoryClient(echoServer());
  try {
    assertEquals((await client.listTools()).tools.map((t) => t.name), httpTools);
  } finally {
    await client.close();
  }
});

Deno.test("H6 fake fetch hang mode rejects with AbortError once the signal fires", async () => {
  const fake = new FakeFetch().on("POST", "http://embeddings.test/v1/embeddings", { hang: true });
  const controller = new AbortController();
  const pending = fake.fetch("http://embeddings.test/v1/embeddings", {
    method: "POST",
    body: "{}",
    signal: controller.signal,
  });
  await new Promise((r) => setTimeout(r, 5));
  assertEquals(fake.inFlight, 1);
  controller.abort();
  const err = await assertRejects(() => pending);
  assertEquals((err as DOMException).name, "AbortError");
  assertEquals(fake.inFlight, 0);
});

Deno.test("H7 fake fetch hold mode keeps replies until release()", async () => {
  const fake = new FakeFetch().on("POST", "http://vision.test/v1/chat/completions", {
    hold: { status: 200, body: { ok: true } },
  });
  let settled = 0;
  const a = fake.fetch("http://vision.test/v1/chat/completions", { method: "POST", body: "{}" }).then((r) => {
    settled++;
    return r;
  });
  const b = fake.fetch("http://vision.test/v1/chat/completions", { method: "POST", body: "{}" }).then((r) => {
    settled++;
    return r;
  });
  await new Promise((r) => setTimeout(r, 5));
  assertEquals(fake.heldCount, 2);
  assertEquals(settled, 0);
  fake.release();
  assertEquals((await a).status, 200);
  assertEquals(await (await b).json(), { ok: true });
  assertEquals(settled, 2);
  assertEquals(fake.heldCount, 0);
});
