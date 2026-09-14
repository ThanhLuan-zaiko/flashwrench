import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authenticate } from "./auth.service";
import { ACCESS_COOKIE } from "./session";
import type { PublicUser, UserRole } from "./user.types";

export type AuthGuardSuccess = { user: PublicUser; response: null };
export type AuthGuardFailure = { user: null; response: NextResponse };
export type AuthGuardResult = AuthGuardSuccess | AuthGuardFailure;

// Read the access token from cookies and verify it server-side.
// Never trust any role sent by the client: the role always comes from DB.
export async function authenticateRequest(): Promise<PublicUser | null> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    return await authenticate(token);
  } catch {
    return null;
  }
}

function unauthorized(): AuthGuardFailure {
  return {
    user: null,
    response: NextResponse.json(
      { errors: { form: "Vui lòng đăng nhập để tiếp tục." } },
      { status: 401 },
    ),
  };
}

function forbidden(): AuthGuardFailure {
  return {
    user: null,
    response: NextResponse.json(
      { errors: { form: "Bạn không có quyền thực hiện thao tác này." } },
      { status: 403 },
    ),
  };
}

// Require any logged-in user. Use in thin route handlers.
export async function requireAuth(): Promise<AuthGuardResult> {
  const user = await authenticateRequest();
  if (!user) return unauthorized();
  return { user, response: null };
}

// Require one of the allowed roles, e.g. requireRole("admin") or
// requireRole("admin", "dispatcher"). Locked users are already
// rejected by authenticate(), so only the role is checked here.
export async function requireRole(
  ...allowed: UserRole[]
): Promise<AuthGuardResult> {
  const user = await authenticateRequest();
  if (!user) return unauthorized();
  if (!allowed.includes(user.role)) return forbidden();
  return { user, response: null };
}
