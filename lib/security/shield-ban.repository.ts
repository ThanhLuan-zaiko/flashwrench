import { scylla } from "@/lib/db/client";

function ttlLiteral(seconds: number): number {
  if (!Number.isInteger(seconds) || seconds <= 0)
    throw new Error("Invalid TTL");
  return seconds;
}

function banBucket(ip: string): string {
  return `shieldban:${ip}`;
}

// Shared ban marker on the existing rate_limits table: window_ms doubles
// as the ban expiry (epoch ms) and the row's TTL erases it afterwards, so
// storage stays bounded and every instance sees the same ban list.
export async function readShieldBan(ip: string): Promise<number | null> {
  const result = await scylla.execute(
    "SELECT window_ms FROM rate_limits WHERE bucket = ?",
    [banBucket(ip)],
    { prepare: true },
  );
  const row = result.first() as unknown as { window_ms: number } | null;
  return row ? Number(row.window_ms) : null;
}

export async function writeShieldBan(
  ip: string,
  untilEpochMs: number,
  banSeconds: number,
): Promise<void> {
  await scylla.execute(
    `INSERT INTO rate_limits (bucket, count, window_ms) VALUES (?, 1, ?) USING TTL ${ttlLiteral(banSeconds)}`,
    [banBucket(ip), untilEpochMs],
    { prepare: true },
  );
}
