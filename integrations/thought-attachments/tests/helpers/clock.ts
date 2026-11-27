/** A settable clock for `Deps.now` and the fake store. */
export const CLOCK_START = "2026-01-01T12:00:00.000Z";

export class Clock {
  private ms: number;

  constructor(start: string | Date = CLOCK_START) {
    this.ms = new Date(start).getTime();
  }

  /** The current time, as a fresh Date. Bound, so it can be passed as `Deps.now`. */
  readonly now = (): Date => new Date(this.ms);

  /** The current time as ISO 8601. */
  iso(): string {
    return new Date(this.ms).toISOString();
  }

  set(at: string | Date): void {
    this.ms = new Date(at).getTime();
  }

  advanceMs(ms: number): void {
    this.ms += ms;
  }

  advanceSeconds(s: number): void {
    this.ms += s * 1000;
  }

  advanceMinutes(m: number): void {
    this.ms += m * 60_000;
  }
}
