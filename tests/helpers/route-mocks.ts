import { mock } from "bun:test";
import type { RefreshOutcome } from "@/lib/auth/auth.service";
import type {
  AuthResult,
  ChangePasswordInput,
  LoginInput,
  PublicUser,
  RegisterInput,
  SessionTokens,
} from "@/lib/auth/user.types";
import type { SessionListItem } from "@/lib/auth/user-sessions";
import { makePublicUser, makeSessionTokens } from "./auth.fixtures";

// Mutable stub state for route-level suites. Route handlers only parse input,
// call a service and shape the response, so every dependency with side
// effects (guards, services, cookies) is stubbed here.

export const routeStubs = {
  guardBlocked: null as Response | null,
  registerResult: null as AuthResult | null,
  loginResult: null as AuthResult | null,
  meUser: null as PublicUser | null,
  refreshOutcome: null as RefreshOutcome | null,
  changePasswordResult: null as AuthResult | null,
  sessionItems: [] as SessionListItem[],
  cookies: {} as Record<string, string>,
};

export function okAuthResult(): AuthResult {
  return {
    ok: true,
    user: makePublicUser(),
    tokens: makeSessionTokens(),
  };
}

export function okRefreshOutcome(): RefreshOutcome {
  const tokens: SessionTokens = makeSessionTokens();
  return { ok: true, user: makePublicUser(), tokens };
}

export const guardMocks = {
  enforceRequestGuards: mock(
    async (): Promise<Response | null> => routeStubs.guardBlocked,
  ),
};

export const authServiceMocks = {
  registerUser: mock(
    async (_input: RegisterInput, _label: string): Promise<AuthResult> =>
      routeStubs.registerResult ?? okAuthResult(),
  ),
  loginUser: mock(
    async (_input: LoginInput, _label: string): Promise<AuthResult> =>
      routeStubs.loginResult ?? okAuthResult(),
  ),
  authenticate: mock(
    async (_token: string): Promise<PublicUser | null> => routeStubs.meUser,
  ),
  refreshSession: mock(
    async (_token: string, _label: string): Promise<RefreshOutcome> =>
      routeStubs.refreshOutcome ?? okRefreshOutcome(),
  ),
  revokeSession: mock(
    async (_userId: string, _familyId: string): Promise<void> => undefined,
  ),
  revokeAllSessions: mock(async (_userId: string): Promise<void> => undefined),
};

export const passwordChangeMocks = {
  changePassword: mock(
    async (
      _userId: string,
      _input: ChangePasswordInput,
      _label: string,
    ): Promise<AuthResult> => routeStubs.changePasswordResult ?? okAuthResult(),
  ),
};

export const userSessionMocks = {
  listUserSessions: mock(
    async (): Promise<SessionListItem[]> => routeStubs.sessionItems,
  ),
  deviceLabel: mock((userAgent: string | null): string => {
    if (!userAgent) return "Unknown device";
    const clean = userAgent.trim().slice(0, 120);
    return clean || "Unknown device";
  }),
};

export const nextHeadersMocks = {
  cookies: mock(async () => ({
    get: (name: string): { value: string } | undefined => {
      const value = routeStubs.cookies[name];
      return value === undefined ? undefined : { value };
    },
  })),
};

export function setMockCookies(cookies: Record<string, string>): void {
  routeStubs.cookies = { ...cookies };
}

export function resetRouteMocks(): void {
  routeStubs.guardBlocked = null;
  routeStubs.registerResult = null;
  routeStubs.loginResult = null;
  routeStubs.meUser = null;
  routeStubs.refreshOutcome = null;
  routeStubs.changePasswordResult = null;
  routeStubs.sessionItems = [];
  routeStubs.cookies = {};
  for (const fn of Object.values(guardMocks)) fn.mockClear();
  for (const fn of Object.values(authServiceMocks)) fn.mockClear();
  for (const fn of Object.values(passwordChangeMocks)) fn.mockClear();
  for (const fn of Object.values(userSessionMocks)) fn.mockClear();
  for (const fn of Object.values(nextHeadersMocks)) fn.mockClear();
}
