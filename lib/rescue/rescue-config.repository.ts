// Raw CQL for rescue dispatch tuning. Single row (config_id='default');
// missing rows fall back to code defaults in the service.
import { scylla } from "@/lib/db/client";

export type DispatchConfigRow = {
  config_id: string;
  offer_timeout_ms: number | null;
  max_reoffers: number | null;
  candidate_limit: number | null;
  updated_at: Date | null;
  updated_by: string | null;
};

export const DISPATCH_CONFIG_ID = "default";

function toIntOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.trunc(value)
    : null;
}

export async function findDispatchConfig(): Promise<DispatchConfigRow | null> {
  const result = await scylla.execute(
    "SELECT config_id, offer_timeout_ms, max_reoffers, candidate_limit, updated_at, updated_by FROM rescue_dispatch_config WHERE config_id = ?",
    [DISPATCH_CONFIG_ID],
    { prepare: true },
  );
  const raw = result.first() as unknown as Record<string, unknown> | null;
  if (!raw) return null;
  const updatedAt = raw.updated_at;
  return {
    config_id: String(raw.config_id),
    offer_timeout_ms: toIntOrNull(raw.offer_timeout_ms),
    max_reoffers: toIntOrNull(raw.max_reoffers),
    candidate_limit: toIntOrNull(raw.candidate_limit),
    updated_at:
      updatedAt instanceof Date && !Number.isNaN(updatedAt.getTime())
        ? updatedAt
        : null,
    updated_by:
      raw.updated_by === null || raw.updated_by === undefined
        ? null
        : String(raw.updated_by),
  };
}

export type SaveDispatchConfigParams = {
  offerTimeoutMs: number;
  maxReoffers: number;
  candidateLimit: number;
  updatedBy: string;
  updatedAt: Date;
};

export async function saveDispatchConfig(
  params: SaveDispatchConfigParams,
): Promise<void> {
  await scylla.execute(
    "INSERT INTO rescue_dispatch_config (config_id, offer_timeout_ms, max_reoffers, candidate_limit, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?)",
    [
      DISPATCH_CONFIG_ID,
      params.offerTimeoutMs,
      params.maxReoffers,
      params.candidateLimit,
      params.updatedAt,
      params.updatedBy,
    ],
    { prepare: true },
  );
}
