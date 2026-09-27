// Rescue dispatch tuning for admins: offer lifetime, re-offer cap and
// candidate fan-out. Missing or partial rows fall back to code defaults
// so a fresh keyspace behaves like today's hardcoded 30s flow.
import type { PublicUser } from "@/lib/auth/user.types";
import { isRecord } from "@/lib/validation";
import {
  findDispatchConfig,
  saveDispatchConfig,
} from "./rescue-config.repository";
import { RESCUE_OFFER_TIMEOUT_MS } from "./rescue-status";

export const DEFAULT_MAX_REOFFERS = 10;
export const DEFAULT_CANDIDATE_LIMIT = 50;

export const OFFER_TIMEOUT_MIN_MS = 10_000;
export const OFFER_TIMEOUT_MAX_MS = 300_000;
export const MAX_REOFFERS_MIN = 0;
export const MAX_REOFFERS_MAX = 20;
export const CANDIDATE_LIMIT_MIN = 5;
export const CANDIDATE_LIMIT_MAX = 50;

export type DispatchConfig = {
  offerTimeoutMs: number;
  maxReoffers: number;
  candidateLimit: number;
  isDefault: boolean;
  updatedAt: string | null;
};

export type DispatchConfigErrors = Partial<
  Record<"offerTimeoutMs" | "maxReoffers" | "candidateLimit" | "form", string>
>;

export type DispatchConfigResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: DispatchConfigErrors };

function inRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function defaultDispatchConfig(): DispatchConfig {
  return {
    offerTimeoutMs: RESCUE_OFFER_TIMEOUT_MS,
    maxReoffers: DEFAULT_MAX_REOFFERS,
    candidateLimit: DEFAULT_CANDIDATE_LIMIT,
    isDefault: true,
    updatedAt: null,
  };
}

export async function getDispatchConfig(): Promise<DispatchConfig> {
  const row = await findDispatchConfig();
  if (!row) return defaultDispatchConfig();
  return {
    offerTimeoutMs: row.offer_timeout_ms ?? RESCUE_OFFER_TIMEOUT_MS,
    maxReoffers: row.max_reoffers ?? DEFAULT_MAX_REOFFERS,
    candidateLimit: row.candidate_limit ?? DEFAULT_CANDIDATE_LIMIT,
    isDefault: false,
    updatedAt: row.updated_at?.toISOString() ?? null,
  };
}

function fail<T>(status: number, form: string): DispatchConfigResult<T> {
  return { ok: false, status, errors: { form } };
}

export async function updateDispatchConfig(
  actor: PublicUser,
  raw: unknown,
): Promise<DispatchConfigResult<{ config: DispatchConfig }>> {
  if (actor.role !== "admin") {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  if (!isRecord(raw)) {
    return fail(400, "Dữ liệu gửi lên không hợp lệ.");
  }
  const errors: DispatchConfigErrors = {};
  // Seconds on the wire (friendlier than ms); stored as ms.
  const timeoutSec = Number(raw.offerTimeoutSec);
  const maxReoffers = Number(raw.maxReoffers);
  const candidateLimit = Number(raw.candidateLimit);
  if (!inRange(timeoutSec, 10, 300)) {
    errors.offerTimeoutMs = "Thời gian chờ mỗi lượt từ 10 đến 300 giây.";
  }
  if (!inRange(maxReoffers, MAX_REOFFERS_MIN, MAX_REOFFERS_MAX)) {
    errors.maxReoffers = "Số lần giao lại từ 0 đến 20.";
  }
  if (!inRange(candidateLimit, CANDIDATE_LIMIT_MIN, CANDIDATE_LIMIT_MAX)) {
    errors.candidateLimit = "Số thợ mỗi lượt từ 5 đến 50.";
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, status: 400, errors };
  }
  const at = new Date();
  await saveDispatchConfig({
    offerTimeoutMs: timeoutSec * 1000,
    maxReoffers,
    candidateLimit,
    updatedBy: actor.id,
    updatedAt: at,
  });
  return {
    ok: true,
    data: {
      config: {
        offerTimeoutMs: timeoutSec * 1000,
        maxReoffers,
        candidateLimit,
        isDefault: false,
        updatedAt: at.toISOString(),
      },
    },
  };
}
