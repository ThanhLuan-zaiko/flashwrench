import type { NextResponse } from "next/server";
import type {
  PublicUser,
  RegisterInput,
  SessionTokens,
  UserRow,
} from "@/lib/auth/user.types";

// Shared builders keep every suite independent: each test derives its own
// fixtures instead of mutating module-level objects. Add new builders here
// when future endpoints need them so all suites stay consistent.

export function makeRegisterInput(
  overrides?: Partial<RegisterInput>,
): RegisterInput {
  return {
    fullName: "Nguyen Van An",
    phone: "0912345678",
    email: "an@example.com",
    password: "secret123",
    confirmPassword: "secret123",
    ...overrides,
  };
}

export function makeUserRow(overrides?: Partial<UserRow>): UserRow {
  return {
    user_id: "11111111-1111-4111-8111-111111111111",
    phone: "0912345678",
    email: "an@example.com",
    password_hash: "hashed:secret123",
    full_name: "Nguyen Van An",
    role: "customer",
    avatar_url: null,
    status: "active",
    token_version: 0,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

export function makePublicUser(overrides?: Partial<PublicUser>): PublicUser {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    fullName: "Nguyen Van An",
    phone: "0912345678",
    email: "an@example.com",
    role: "customer",
    avatarUrl: null,
    status: "active",
    tokenVersion: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeSessionTokens(
  overrides?: Partial<SessionTokens>,
): SessionTokens {
  return {
    accessToken: "access-token",
    refreshToken: "fw1.cGF5bG9hZA.c2VjcmV0",
    familyId: "22222222-2222-4222-8222-222222222222",
    ...overrides,
  };
}

export function postJsonRequest(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

export function invalidJsonRequest(path: string): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not-json",
  });
}

export async function readJsonBody(response: Response): Promise<unknown> {
  return (await response.json()) as unknown;
}

export function getResponseCookie(
  response: NextResponse,
  name: string,
): string | undefined {
  return response.cookies.get(name)?.value;
}
