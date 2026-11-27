/** vision (T037): research R4, contracts/settings.md, FR-006, FR-009. */
import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "jsr:@std/assert@1.0.19";
import { encodeBase64 } from "jsr:@std/encoding@1.0.11/base64";
import { createVisionClient } from "../src/vision.ts";
import { loadSettings } from "../src/settings.ts";
import type { Settings } from "../src/types.ts";
import {
  envGetter,
  VISION_API_BASE,
  VISION_API_KEY,
  VISION_MODEL,
} from "./helpers/env.ts";
import { chatReply, FakeFetch, visionResponder } from "./helpers/fake_fetch.ts";

function settingsWith(
  overrides: Record<string, string | undefined> = {},
): Settings {
  const result = loadSettings(envGetter(overrides));
  if (!result.ok) {
    throw new Error(
      `expected ok settings, got problems: ${JSON.stringify(result.problems)}`,
    );
  }
  return result.settings;
}

const URL_ = `${VISION_API_BASE}/chat/completions`;
const BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70]);

Deno.test("U172 configured is false when VISION_API_BASE or VISION_MODEL is unset", () => {
  const fetch = new FakeFetch().fetch;
  assertEquals(createVisionClient(settingsWith(), fetch).configured, true);
  assertEquals(
    createVisionClient(settingsWith({ VISION_API_BASE: undefined }), fetch)
      .configured,
    false,
  );
  assertEquals(
    createVisionClient(settingsWith({ VISION_MODEL: undefined }), fetch)
      .configured,
    false,
  );
});

interface ChatBody {
  model: string;
  messages: {
    role: string;
    content: { type: string; text?: string; image_url?: { url: string } }[];
  }[];
}

Deno.test("U173 caption posts to <VISION_API_BASE>/chat/completions with the model and the image as a data URL of its real type", async () => {
  const ff = new FakeFetch().on("POST", URL_, visionResponder("a red door"));
  const client = createVisionClient(settingsWith(), ff.fetch);
  const out = await client.caption(BYTES, "image/png");
  assert("data" in out);
  assertEquals(ff.requests.length, 1);
  assertEquals(ff.requests[0].method, "POST");
  assertEquals(ff.requests[0].url, URL_);
  const body = ff.requests[0].body as ChatBody;
  assertEquals(body.model, VISION_MODEL);
  const image = body.messages.flatMap((m) => m.content).find((p) =>
    p.type === "image_url"
  );
  assertEquals(
    image?.image_url?.url,
    `data:image/png;base64,${encodeBase64(BYTES)}`,
  );
});

Deno.test("U174 the prompt asks for the visible objects, places, labels and text", async () => {
  const ff = new FakeFetch().on("POST", URL_, visionResponder("a red door"));
  await createVisionClient(settingsWith(), ff.fetch).caption(
    BYTES,
    "image/jpeg",
  );
  const body = ff.requests[0].body as ChatBody;
  const prompt =
    body.messages.flatMap((m) => m.content).find((p) => p.type === "text")
      ?.text ?? "";
  for (const word of ["objects", "places", "labels", "text"]) {
    assertStringIncludes(prompt.toLowerCase(), word);
  }
});

Deno.test("U175 with VISION_API_KEY set the request carries it as a bearer token", async () => {
  const ff = new FakeFetch().on("POST", URL_, visionResponder("a red door"));
  await createVisionClient(settingsWith(), ff.fetch).caption(
    BYTES,
    "image/jpeg",
  );
  assertEquals(
    ff.requests[0].headers["authorization"],
    `Bearer ${VISION_API_KEY}`,
  );
});

Deno.test("U176 with VISION_API_KEY unset the request has no Authorization header", async () => {
  const ff = new FakeFetch().on("POST", URL_, visionResponder("a red door"));
  await createVisionClient(
    settingsWith({ VISION_API_KEY: undefined }),
    ff.fetch,
  ).caption(BYTES, "image/jpeg");
  assertEquals(ff.requests.length, 1);
  assert(!("authorization" in ff.requests[0].headers));
});

Deno.test("U177 a successful reply gives the caption text and the configured model", async () => {
  const ff = new FakeFetch().on(
    "POST",
    URL_,
    visionResponder("  a red door with a brass 14  "),
  );
  const out = await createVisionClient(settingsWith(), ff.fetch).caption(
    BYTES,
    "image/jpeg",
  );
  assertEquals(out, {
    data: { text: "a red door with a brass 14", model: VISION_MODEL },
  });
});

Deno.test("U178 an unreachable endpoint fails with a reason", async () => {
  const ff = new FakeFetch().on("POST", URL_, {
    networkError: "connection refused",
  });
  const out = await createVisionClient(settingsWith(), ff.fetch).caption(
    BYTES,
    "image/jpeg",
  );
  assert("error" in out);
  assertStringIncludes(out.error, "unreachable");
  assertStringIncludes(out.error, VISION_API_BASE);
});

Deno.test("U179 a non-2xx status fails with the status in the reason", async () => {
  const ff = new FakeFetch().on("POST", URL_, {
    status: 502,
    body: "bad gateway",
  });
  const out = await createVisionClient(settingsWith(), ff.fetch).caption(
    BYTES,
    "image/jpeg",
  );
  assert("error" in out);
  assertStringIncludes(out.error, "502");
});

Deno.test("U180 an empty or whitespace-only caption fails with a reason", async () => {
  for (
    const reply of [chatReply(""), chatReply(" \n\t "), {
      status: 200,
      body: { choices: [] },
    }]
  ) {
    const ff = new FakeFetch().on("POST", URL_, reply);
    const out = await createVisionClient(settingsWith(), ff.fetch).caption(
      BYTES,
      "image/jpeg",
    );
    assert(
      "error" in out,
      `expected an error for ${JSON.stringify(reply.body)}`,
    );
    assertStringIncludes(out.error, "empty caption");
  }
});

Deno.test("U181 a key value in an error is redacted", async () => {
  const replies = [
    { status: 401, body: `invalid api key ${VISION_API_KEY} for this account` },
    { networkError: `failed calling with Bearer ${VISION_API_KEY}` },
  ];
  for (const reply of replies) {
    const ff = new FakeFetch().on("POST", URL_, reply);
    const out = await createVisionClient(settingsWith(), ff.fetch).caption(
      BYTES,
      "image/jpeg",
    );
    assert("error" in out);
    assert(!out.error.includes(VISION_API_KEY), out.error);
  }
});
