export type WindowHit = {
  allowed: boolean;
  retryAfterSec: number;
};

type Entry = {
  windowStart: number;
  count: number;
};

// In-memory fixed-window counter: one entry per key, reset at each window
// boundary. Stale entries are removed lazily on write and on a periodic
// sweep so the map stays bounded without a timer per key.
export class FixedWindowCounter {
  private readonly entries = new Map<string, Entry>();
  private lastSweep = 0;

  constructor(
    private readonly now: () => number = () => Date.now(),
    private readonly maxKeys = 50_000,
  ) {}

  hit(key: string, limit: number, windowMs: number): WindowHit {
    const now = this.now();
    this.sweep(now, windowMs);

    const entry = this.entries.get(key);
    if (!entry || now - entry.windowStart >= windowMs) {
      this.entries.set(key, { windowStart: now, count: 1 });
      return { allowed: true, retryAfterSec: 0 };
    }

    if (entry.count >= limit) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((entry.windowStart + windowMs - now) / 1000),
      );
      return { allowed: false, retryAfterSec };
    }

    entry.count += 1;
    return { allowed: true, retryAfterSec: 0 };
  }

  // Always increments and reports the count inside the current window —
  // for strike tracking, where the caller decides the threshold.
  record(key: string, windowMs: number): number {
    const now = this.now();
    this.sweep(now, windowMs);
    const entry = this.entries.get(key);
    if (!entry || now - entry.windowStart >= windowMs) {
      this.entries.set(key, { windowStart: now, count: 1 });
      return 1;
    }
    entry.count += 1;
    return entry.count;
  }

  peek(key: string): number {
    return this.entries.get(key)?.count ?? 0;
  }

  // Entries older than two windows can never be read again; drop them.
  // The sweep runs at most once per window regardless of hit volume.
  private sweep(now: number, windowMs: number): void {
    if (now - this.lastSweep < windowMs) return;
    this.lastSweep = now;
    if (this.entries.size <= this.maxKeys) return;
    const cutoff = now - windowMs * 2;
    for (const [key, entry] of this.entries) {
      if (entry.windowStart < cutoff) this.entries.delete(key);
    }
    // Overflow beyond the sweep's reach: oldest entries go first so a
    // flood of fresh keys cannot grow the map without bound.
    if (this.entries.size > this.maxKeys) {
      const sorted = [...this.entries.entries()].sort(
        (a, b) => a[1].windowStart - b[1].windowStart,
      );
      for (const [key] of sorted.slice(0, this.entries.size - this.maxKeys)) {
        this.entries.delete(key);
      }
    }
  }
}
