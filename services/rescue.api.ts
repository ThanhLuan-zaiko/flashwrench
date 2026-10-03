import type {
  CreatedRescue,
  CreateRescueInput,
  RescueFieldErrors,
} from "@/lib/rescue/rescue.types";
import type { CustomerCancelRescueOutcome } from "@/lib/rescue/rescue-customer-actions.service";
import type {
  RescueDetail,
  RescueTracking,
} from "@/lib/rescue/rescue-reader.service";
import { AuthApiError, apiRequest } from "./auth.api";
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
// access-refresh retry. Guests file with name + phone + email (the email
// is the key the OTP lookup verifies later); logged-in customers reuse the
// same endpoint and get linked server-side.
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

// Customer self-cancel while no mechanic has departed. apiRequest carries
// the session + refresh retry; AuthApiError is rewrapped like the booking
// cancel so callers only ever handle RescueApiError.
export async function cancelRescueRequest(
  requestId: string,
  note: string,
): Promise<{ rescue: CustomerCancelRescueOutcome }> {
  try {
    return await apiRequest<{ rescue: CustomerCancelRescueOutcome }>(
      `/api/rescue/${encodeURIComponent(requestId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ action: "cancel", note }),
      },
    );
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw new RescueApiError(error.status, error.errors as RescueFieldErrors);
    }
    throw error;
  }
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
