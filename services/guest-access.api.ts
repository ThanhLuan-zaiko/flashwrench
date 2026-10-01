// Guest-access API client. No access-refresh retry on purpose: the
// guest-access cookie is independent of fw_at/fw_rt, and a 401 here means
// "the lookup session expired", which the screen answers by showing the OTP
// step again rather than by refreshing anything.
import type {
  GuestInvoice,
  GuestRecordList,
  GuestRecordType,
} from "@/lib/guest-access/guest-access.types";

export type { GuestInvoice, GuestRecordList, GuestRecordType };

export const OTP_PURPOSE_GUEST_ACCESS = "guest_access";

export class GuestAccessApiError extends Error {
  status: number;
  errors: { form?: string; code?: string; email?: string };

  constructor(status: number, errors: GuestAccessApiError["errors"]) {
    super(errors.form ?? errors.code ?? "Đã có lỗi xảy ra.");
    this.name = "GuestAccessApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function parseBody(response: Response): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = await response.json();
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {};
    }
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

function toErrors(
  body: Record<string, unknown>,
): GuestAccessApiError["errors"] {
  if (body.errors && typeof body.errors === "object") {
    return body.errors as GuestAccessApiError["errors"];
  }
  return { form: "Đã có lỗi xảy ra. Vui lòng thử lại." };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await parseBody(response);
  if (!response.ok) {
    throw new GuestAccessApiError(response.status, toErrors(body));
  }
  return body as T;
}

export type OtpSent = {
  maskedEmail: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
};

export async function requestOtpRequest(email: string): Promise<OtpSent> {
  return request<OtpSent>("/api/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ email, purpose: OTP_PURPOSE_GUEST_ACCESS }),
  });
}

export async function requestOtpVerify(
  email: string,
  code: string,
): Promise<void> {
  await request("/api/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({
      email,
      code,
      purpose: OTP_PURPOSE_GUEST_ACCESS,
    }),
  });
}

export async function fetchGuestRecords(): Promise<GuestRecordList> {
  return request<GuestRecordList>("/api/guest-access/records");
}

export async function fetchGuestInvoice(
  type: GuestRecordType,
  id: string,
): Promise<GuestInvoice> {
  return request<GuestInvoice>(
    `/api/guest-access/invoice?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`,
  );
}
