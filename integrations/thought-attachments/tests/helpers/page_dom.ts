/**
 * A minimal DOM, `location`, timer and `fetch` stand-in that runs the inline script of
 * `upload-page.html` (spec 007, T044). No real browser: elements are made from the `id`
 * attributes found in the HTML, and the script sees only the pieces below.
 */

const PAGE_FILE = new URL("../../upload-page.html", import.meta.url);

export function readPageSource(): string {
  return Deno.readTextFileSync(PAGE_FILE);
}

type Listener = () => void | Promise<void>;

export class FakeElement {
  textContent = "";
  hidden = false;
  files: File[] = [];
  value = "";
  private listeners = new Map<string, Listener[]>();

  constructor(readonly id: string, readonly tag: string, readonly attrs: Record<string, string>) {
    this.hidden = "hidden" in attrs;
  }

  getAttribute(name: string): string | null {
    return name in this.attrs ? this.attrs[name] : null;
  }

  hasAttribute(name: string): boolean {
    return name in this.attrs;
  }

  addEventListener(type: string, fn: Listener): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), fn]);
  }

  async dispatch(type: string): Promise<void> {
    for (const fn of this.listeners.get(type) ?? []) await fn();
  }
}

interface Timer {
  id: number;
  at: number;
  fn: () => void;
}

export interface PageOptions {
  /** The address the page was opened at, fragment included. */
  href: string;
  fetch: typeof fetch;
  /** The page's source; defaults to `upload-page.html`. */
  html?: string;
}

/** Every page made in this module, so `settle()` can wait for all of them. */
const pages = new Set<Page>();

/** The most yields `settle()` waits for a page to go quiet before it fails the test. */
const SETTLE_LIMIT = 1000;

/**
 * Wait until every page is quiet: no fetch reply or body read is being worked through, and nothing the page
 * shows or schedules changed across a whole turn of the event loop. A fetch the network holds or hangs stays
 * open without making the page busy. Fails instead of returning when a page never goes quiet.
 */
export async function settle(): Promise<void> {
  let last = "";
  for (let i = 0; i < SETTLE_LIMIT; i++) {
    await new Promise<void>((go) => setTimeout(go, 0));
    const now = JSON.stringify([...pages].map((p) => p.signature()));
    if (now === last && [...pages].every((p) => p.reading === 0)) return;
    last = now;
  }
  throw new Error(`settle: a page was still changing after ${SETTLE_LIMIT} turns of the event loop`);
}

export class Page {
  readonly source: string;
  readonly elements = new Map<string, FakeElement>();
  private timers: Timer[] = [];
  private nextTimer = 1;
  /** Virtual milliseconds since load. */
  now = 0;
  /** Fetches the page has started, and how many of them have answered or failed. */
  fetchesStarted = 0;
  fetchesSettled = 0;
  /** Response bodies the page is still reading. */
  reading = 0;

  constructor(opts: PageOptions) {
    this.source = opts.html ?? readPageSource();
    const tag = /<(\w+)\b([^>]*)>([^<]*)/g;
    for (const m of this.source.matchAll(tag)) {
      const attrs: Record<string, string> = {};
      for (const a of m[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[a[1]] = a[2] ?? "";
      if (attrs.id) {
        const el = new FakeElement(attrs.id, m[1].toLowerCase(), attrs);
        el.textContent = m[3].trim();
        this.elements.set(attrs.id, el);
      }
    }
    const script = this.source.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? "";
    const url = new URL(opts.href);
    const location = { href: url.href, origin: url.origin, pathname: url.pathname, search: url.search, hash: url.hash };
    const document = {
      getElementById: (id: string) => this.elements.get(id) ?? null,
    };
    const setTimer = (fn: () => void, ms: number) => {
      const id = this.nextTimer++;
      this.timers.push({ id, at: this.now + ms, fn });
      return id;
    };
    const clearTimer = (id: number) => {
      this.timers = this.timers.filter((t) => t.id !== id);
    };
    // The page's fetch, counted: a started request, its answer, and each body read the page makes from it.
    const tracked = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      this.fetchesStarted++;
      return opts.fetch(input, init).then(
        (res) => {
          this.fetchesSettled++;
          return this.trackBody(res);
        },
        (error) => {
          this.fetchesSettled++;
          throw error;
        },
      );
    };
    pages.add(this);
    new Function("document", "location", "fetch", "setTimeout", "clearTimeout", script)(
      document,
      location,
      tracked,
      setTimer,
      clearTimer,
    );
  }

  private trackBody(res: Response): Response {
    for (const method of ["json", "text", "arrayBuffer", "blob"] as const) {
      const read = res[method].bind(res) as () => Promise<unknown>;
      Object.defineProperty(res, method, {
        value: () => {
          this.reading++;
          return read().finally(() => this.reading--);
        },
      });
    }
    return res;
  }

  /** What the page shows and has scheduled, and how far its requests have got. */
  signature(): string {
    const els = [...this.elements.values()].map((e) => [e.id, e.textContent, e.hidden, e.value]);
    return JSON.stringify([this.fetchesStarted, this.fetchesSettled, this.reading, this.now, this.timers.map((t) => t.at), els]);
  }

  el(id: string): FakeElement {
    const e = this.elements.get(id);
    if (!e) throw new Error(`no element #${id}`);
    return e;
  }

  text(id: string): string {
    return this.el(id).textContent;
  }

  /** Number of timers still waiting. */
  get pendingTimers(): number {
    return this.timers.length;
  }

  /** Pick a file in the file input, as the owner would. */
  async pick(file: { name: string; type: string; size: number }, inputId = "file"): Promise<void> {
    const input = this.el(inputId);
    input.files = [new File([new Uint8Array(file.size)], file.name, { type: file.type })];
    await input.dispatch("change");
  }

  /** Advance the injected clock, running the timers that fall due. */
  async advance(ms: number): Promise<void> {
    const target = this.now + ms;
    for (;;) {
      const due = this.timers.filter((t) => t.at <= target).sort((a, b) => a.at - b.at || a.id - b.id)[0];
      if (!due) break;
      this.timers = this.timers.filter((t) => t !== due);
      this.now = due.at;
      due.fn();
      await settle();
    }
    this.now = target;
  }
}

/** Load the page and let its first requests settle. */
export async function loadPage(opts: PageOptions): Promise<Page> {
  const page = new Page(opts);
  await settle();
  return page;
}
