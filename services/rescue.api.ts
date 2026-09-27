import type {
  CreatedRescue,
  CreateRescueInput,
  RescueFieldErrors,
} from "@/lib/rescue/rescue.types";

export type { CreatedRescue, CreateRescueInput, RescueFieldErrors };

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
