import type { AccountSession } from "@/lib/auth/account-status";
import type { FieldErrors, PublicUser } from "@/lib/auth/user.types";
import type { SessionListItem } from "@/lib/auth/user-sessions";

export type { FieldErrors, PublicUser, SessionListItem };
export type {
  AccountBlockReason,
  AccountSession,
  AccountStatus,
} from "@/lib/auth/account-status";

export type RegisterPayload = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export class AuthApiError extends Error {
  status: number;
  errors: FieldErrors;

  constructor(status: number, errors: FieldErrors) {
    super(errors.form ?? "Đã có lỗi xảy ra.");
    this.name = "AuthApiError";
    this.status = status;
    this.errors = errors;
  }
}

const NO_AUTO_REFRESH = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
]);

async function parseBody(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function toFieldErrors(body: Record<string, unknown>): FieldErrors {
  if (body.errors && typeof body.errors === "object") {
    return body.errors as FieldErrors;
  }
  return { form: "Đã có lỗi xảy ra. Vui lòng thử lại." };
}

async function rawRequest(path: string, init?: RequestInit): Promise<Response> {
  return fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

// The access token lives only 15 minutes: on 401, try one refresh and
// then replay the original request. Skipped for login/register/refresh.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response = await rawRequest(path, init);
  if (response.status === 401 && !NO_AUTO_REFRESH.has(path)) {
    const refreshed = await rawRequest("/api/auth/refresh", { method: "POST" });
    if (refreshed.ok) {
      response = await rawRequest(path, init);
    }
  }
  const body = await parseBody(response);
  if (!response.ok) {
    throw new AuthApiError(response.status, toFieldErrors(body));
  }
  return body as T;
}

// Shared JSON request with one auto-refresh retry. Used by auth calls
// above and by feature API clients such as services/admin.api.ts.
export function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, init);
}

export function registerRequest(payload: RegisterPayload) {
  return request<{ user: PublicUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginRequest(payload: LoginPayload) {
  return request<{ user: PublicUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Single source for "who am I and is my account still usable". Never throws:
// the header renders a logged-out state when the call fails.
export async function fetchAccountSession(): Promise<AccountSession> {
  try {
    return await request<AccountSession>("/api/auth/me");
  } catch {
    return { user: null, status: "active" };
  }
}

export async function fetchSessions(): Promise<SessionListItem[]> {
  const data = await request<{ sessions: SessionListItem[] }>(
    "/api/auth/sessions",
  );
  return data.sessions;
}

export async function revokeSessionRequest(familyId: string): Promise<void> {
  await request(`/api/auth/sessions/${familyId}`, { method: "DELETE" });
}

export async function logoutRequest(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function logoutAllRequest(): Promise<void> {
  await fetch("/api/auth/logout-all", { method: "POST" });
}

export function changePasswordRequest(payload: ChangePasswordPayload) {
  return request<{ user: PublicUser }>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
