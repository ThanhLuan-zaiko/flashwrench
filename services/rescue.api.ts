import type {
  CreatedRescue,
  CreateRescueInput,
  RescueFieldErrors,
} from "@/lib/rescue/rescue.types";
import type {
  RescueDetail,
  RescueTracking,
} from "@/lib/rescue/rescue-reader.service";
import { apiRequest } from "./auth.api";
import type { RescueDetailPayload } from "./rescue-mechanic.api";

export type {
  CreatedRescue,
  CreateRescueInput,
  RescueDetail,
  RescueFieldErrors,
  RescueTracking,
};

export class RescueApiError extends Error {
  status: number;
  errors: RescueFieldErrors;

  constructor(status: number, errors: RescueFieldErrors) {
    super(errors.form ?? "Đã có lỗi xảy ra.");
    this.name = "RescueApiError";
    this.status = status;
    this.errors = errors;
  }
}

function toFieldErrors(body: Record<string, unknown>): RescueFieldErrors {
  if (body.errors && typeof body.errors === "object") {
    return body.errors as RescueFieldErrors;
  }
  return { form: "Đã có lỗi xảy ra. Vui lòng thử lại." };
}

// Public rescue intake: no session required, so plain fetch with no
// access-refresh retry. Guests file with name + phone; logged-in
// customers reuse the same endpoint and get linked server-side.
export async function createRescueRequest(
  payload: CreateRescueInput,
): Promise<{ request: CreatedRescue }> {
  const response = await fetch("/api/rescue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = await response.json();
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      body = parsed as Record<string, unknown>;
    }
  } catch {
    body = {};
  }
  if (!response.ok) {
    throw new RescueApiError(response.status, toFieldErrors(body));
  }
  return body as { request: CreatedRescue };
}

// Signed-in customer history: same /api/rescue resource, GET side.
// apiRequest carries the session cookie and refreshes on expiry.
export function fetchMyRescues(): Promise<{ items: RescueDetail[] }> {
  return apiRequest<{ items: RescueDetail[] }>("/api/rescue");
}

export function fetchMyRescueDetail(
  requestId: string,
): Promise<RescueDetailPayload> {
  return apiRequest<RescueDetailPayload>(
    `/api/rescue/${encodeURIComponent(requestId)}`,
  );
}

// Guest-facing journey tracking: no session, the unguessable request id
// is the capability. Plain fetch like createRescueRequest.
export async function fetchRescueTracking(
  requestId: string,
): Promise<{ tracking: RescueTracking }> {
  const response = await fetch(
    `/api/rescue/${encodeURIComponent(requestId)}/track`,
  );
  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok) {
    throw new RescueApiError(response.status, toFieldErrors(body));
  }
  return body as { tracking: RescueTracking };
}
