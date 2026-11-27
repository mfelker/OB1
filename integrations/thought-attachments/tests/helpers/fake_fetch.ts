/**
 * A scripted `fetch` standing in for the embedding and vision endpoints and
 * for Supabase (PostgREST and Storage) in the adapter tests. No network: tests
 * run without --allow-net.
 */

export interface RecordedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  /** Parsed JSON body, the raw text when it is not JSON, or undefined. */
  body: unknown;
}

export interface Reply {
  status?: number;
  /** An object is sent as JSON; a string or bytes are sent as-is. */
  body?: unknown;
  headers?: Record<string, string>;
}

export type Handler =
  | Reply
  | { networkError: string }
  /** Never answers; rejects with an AbortError once the request's signal fires. */
  | { hang: true }
  /** Answers `reply` only after `release()` is called (or rejects on abort). */
  | { hold: Reply }
  | ((req: RecordedRequest) => Reply | Promise<Reply>);

interface Route {
  method: string;
  url: string;
  handlers: Handler[];
  calls: number;
}

function abortError(): DOMException {
  return new DOMException("The signal has been aborted", "AbortError");
}

export class FakeFetch {
  readonly requests: RecordedRequest[] = [];
  readonly unmatched: RecordedRequest[] = [];
  private routes: Route[] = [];
  private held: Array<() => void> = [];
  /** Requests that have started and not yet settled. */
  inFlight = 0;

  /**
   * Register a route keyed by method and URL. `url` matches the full request
   * URL, the URL without its query string, or, when it ends with `*`, any URL
   * starting with the part before the `*`. With several handlers, call N uses
   * handler N and the last one repeats. A later registration of the same key
   * replaces the earlier one.
   */
  on(method: string, url: string, ...handlers: Handler[]): this {
    if (handlers.length === 0) throw new Error("FakeFetch.on needs a handler");
    const m = method.toUpperCase();
    this.routes = this.routes.filter((r) => !(r.method === m && r.url === url));
    this.routes.push({ method: m, url, handlers, calls: 0 });
    return this;
  }

  /** Release every held reply. */
  release(): void {
    const pending = this.held.splice(0);
    for (const go of pending) go();
  }

  /** Number of held replies waiting for release(). */
  get heldCount(): number {
    return this.held.length;
  }

  /** Recorded requests whose URL starts with `prefix`. */
  requestsTo(prefix: string): RecordedRequest[] {
    return this.requests.filter((r) => r.url.startsWith(prefix));
  }

  readonly fetch: typeof fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const signal = init?.signal ?? request.signal;
    const headers: Record<string, string> = {};
    request.headers.forEach((v, k) => (headers[k] = v));
    const text = request.body ? await request.text() : "";
    let body: unknown = undefined;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
    const rec: RecordedRequest = { url: request.url, method: request.method.toUpperCase(), headers, body };
    this.requests.push(rec);

    const bare = rec.url.split("?")[0];
    const route = this.routes.find((r) =>
      r.method === rec.method &&
      (r.url === rec.url || r.url === bare || (r.url.endsWith("*") && rec.url.startsWith(r.url.slice(0, -1))))
    );
    if (!route) {
      this.unmatched.push(rec);
      throw new TypeError(`FakeFetch: no route for ${rec.method} ${rec.url}`);
    }
    const handler = route.handlers[Math.min(route.calls, route.handlers.length - 1)];
    route.calls++;

    this.inFlight++;
    try {
      return await this.answer(handler, rec, signal);
    } finally {
      this.inFlight--;
    }
  };

  private async answer(handler: Handler, rec: RecordedRequest, signal?: AbortSignal | null): Promise<Response> {
    if (signal?.aborted) throw abortError();
    if (typeof handler === "function") return toResponse(await handler(rec));
    if ("networkError" in handler) throw new TypeError(handler.networkError);
    if ("hang" in handler) {
      return await new Promise<Response>((_, reject) => {
        signal?.addEventListener("abort", () => reject(abortError()), { once: true });
      });
    }
    if ("hold" in handler) {
      const reply = handler.hold;
      return await new Promise<Response>((resolve, reject) => {
        this.held.push(() => resolve(toResponse(reply)));
        signal?.addEventListener("abort", () => reject(abortError()), { once: true });
      });
    }
    return toResponse(handler);
  }
}

function toResponse(reply: Reply): Response {
  const status = reply.status ?? 200;
  const headers = new Headers(reply.headers ?? {});
  let payload: BodyInit | null = null;
  if (reply.body !== undefined) {
    if (typeof reply.body === "string") {
      payload = reply.body;
    } else if (reply.body instanceof Uint8Array) {
      payload = reply.body as Uint8Array<ArrayBuffer>;
    } else {
      payload = JSON.stringify(reply.body);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
    }
  }
  const nullBody = status === 204 || status === 304;
  return new Response(nullBody ? null : payload, { status, headers });
}

/** FNV-1a over a string's UTF-16 code units. */
function hash32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** A deterministic unit-length vector of `length` for `text`: the same text always gives the same vector. */
export function vectorFor(text: string, length = 1536): number[] {
  let s = hash32(text) || 1;
  const v = new Array<number>(length);
  let norm = 0;
  for (let i = 0; i < length; i++) {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    v[i] = s / 0xffffffff - 0.5;
    norm += v[i] * v[i];
  }
  const n = Math.sqrt(norm);
  return v.map((x) => x / n);
}

/** A unit-length vector along `axis` (for scripted similarity). */
export function axisVector(axis: number, length = 1536): number[] {
  const v = new Array(length).fill(0);
  v[axis % length] = 1;
  return v;
}

/** An OpenAI-compatible embeddings reply for the given vectors. */
export function embeddingReply(vectors: number[][]): Reply {
  return {
    status: 200,
    body: { object: "list", data: vectors.map((embedding, index) => ({ object: "embedding", index, embedding })) },
  };
}

/**
 * An embeddings responder: answers each request with `vectorFor(text, length)`
 * for every input text (a string or an array of strings), in order.
 */
export function embeddingResponder(length = 1536): (req: RecordedRequest) => Reply {
  return (req) => {
    const input = (req.body as { input?: unknown } | undefined)?.input;
    const texts = Array.isArray(input) ? input.map(String) : input === undefined ? [] : [String(input)];
    return embeddingReply(texts.map((t) => vectorFor(t, length)));
  };
}

/** An OpenAI-compatible chat-completions reply. */
export function chatReply(content: string, model = "test/vision-model"): Reply {
  return {
    status: 200,
    body: { model, choices: [{ index: 0, message: { role: "assistant", content } }] },
  };
}

/** A vision responder: every request gets the scripted caption. */
export function visionResponder(caption: string, model = "test/vision-model"): (req: RecordedRequest) => Reply {
  return () => chatReply(caption, model);
}
