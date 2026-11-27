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

/** Let pending promise chains (and zero-delay real timers) run. */
export async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await new Promise<void>((go) => setTimeout(go, 0));
}

export class Page {
  readonly source: string;
  readonly elements = new Map<string, FakeElement>();
  private timers: Timer[] = [];
  private nextTimer = 1;
  /** Virtual milliseconds since load. */
  now = 0;

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
    new Function("document", "location", "fetch", "setTimeout", "clearTimeout", script)(
      document,
      location,
      opts.fetch,
      setTimer,
      clearTimer,
    );
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
