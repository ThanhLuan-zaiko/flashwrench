import { scylla } from "@/lib/db/client";

export type RateLimitDecision = {
  allowed: boolean;
  retryAfterSec: number;
};

function ttlLiteral(seconds: number): number {
  if (!Number.isInteger(seconds) || seconds <= 0)
    throw new Error("Invalid TTL");
  return seconds;
}

// Fixed-window counter in ScyllaDB: exact per window via LWT, shared across
// instances, auto-cleaned by TTL. No RAM growth, no extra infrastructure.
export async function consumeRateLimit(
  bucket: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitDecision> {
  const ttl = ttlLiteral(Math.max(60, Math.ceil((windowMs * 2) / 1000)));
  const windowNumber = Math.floor(Date.now() / windowMs);
  const windowEnd = (windowNumber + 1) * windowMs;
  const retryAfterSec = Math.max(1, Math.ceil((windowEnd - Date.now()) / 1000));

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const found = await scylla.execute(
      "SELECT count, window_ms FROM rate_limits WHERE bucket = ?",
      [bucket],
      {
        prepare: true,
      },
    );
    const row = found.first() as unknown as {
      count: number;
      window_ms: number;
    } | null;

    if (!row) {
      const inserted = await scylla.execute(
        `INSERT INTO rate_limits (bucket, count, window_ms) VALUES (?, 1, ?) IF NOT EXISTS USING TTL ${ttl}`,
        [bucket, windowMs],
        { prepare: true },
      );
      const applied =
        (inserted.first() as unknown as { "[applied]": boolean } | null)?.[
          "[applied]"
        ] ?? false;
      if (applied) return { allowed: true, retryAfterSec: 0 };
      continue;
    }

    if (row.count >= limit) return { allowed: false, retryAfterSec };

    const updated = await scylla.execute(
      `UPDATE rate_limits USING TTL ${ttl} SET count = ?, window_ms = ? WHERE bucket = ? IF count = ?`,
      [row.count + 1, windowMs, bucket, row.count],
      { prepare: true },
    );
    const applied =
      (updated.first() as unknown as { "[applied]": boolean } | null)?.[
        "[applied]"
      ] ?? false;
    if (applied) return { allowed: true, retryAfterSec: 0 };
  }

  return { allowed: false, retryAfterSec };
}
