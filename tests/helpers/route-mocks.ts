import { mock } from "bun:test";
import { NextResponse } from "next/server";
import type { AccountSession } from "@/lib/auth/account-status";
import type { RefreshOutcome } from "@/lib/auth/auth.service";
import type { StaffCreateResult } from "@/lib/auth/staff.types";
import type { PendingStaffPassword } from "@/lib/auth/staff-pending.service";
import type {
  AuthResult,
  ChangePasswordInput,
  LoginInput,
  PublicUser,
  RegisterInput,
  UserRole,
} from "@/lib/auth/user.types";
import type { SessionListItem } from "@/lib/auth/user-sessions";
import type {
  BookingResult,
  CreateBookingInput,
  CreatedBooking,
} from "@/lib/booking/booking.types";
import type {
  BookingSummary,
  CursorPage,
  WorkspaceResult,
} from "@/lib/booking/workspace.types";
import type { MechanicResult } from "@/lib/mechanic/mechanic.types";
import type {
  ListMechanicsParams,
  MechanicDirectoryItem,
} from "@/lib/mechanic/mechanic-directory.service";
import { makePublicUser } from "./auth.fixtures";
import { resetCatalogRouteMocks } from "./catalog-route.mocks";
import { mediaStorageMocks } from "./media.mocks";
import { resetMediaRouteMocks } from "./media-route.mocks";

export { mediaStorageMocks };

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
  pendingPasswordItems: [] as PendingStaffPassword[],
  pendingCryptoConfigured: true,
  resetStaffResult: null as StaffCreateResult | null,
  adminActionResult: null as AdminActionStub | null,
  meSession: null as AccountSession | null,
  bookingUser: null as PublicUser | null,
  bookingCreateResult: null as BookingResult<CreatedBooking> | null,
  bookingListResult: null as WorkspaceResult<CursorPage<BookingSummary>> | null,
  mechanicsList: null as MechanicResult<MechanicDirectoryItem[]> | null,
  workspaceResult: null as WorkspaceResult<unknown> | null,
};
export {
  avatarServiceMocks,
  mediaRouteStubs,
  mediaServiceMocks,
  okMediaAsset,
  resetMediaRouteMocks,
} from "./media-route.mocks";

import {
  okAccountSession,
  okAuthResult,
  okCreatedBooking,
  okMechanicDirectoryItem,
  okRefreshOutcome,
} from "./route.fixtures";

export {
  okAccountSession,
  okAuthResult,
  okCreatedBooking,
  okMechanicDirectoryItem,
  okRefreshOutcome,
} from "./route.fixtures";

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

export const staffPendingRouteMocks = {
  listPendingTempPasswords: mock(
    async (_userIds: string[]): Promise<PendingStaffPassword[]> =>
      routeStubs.pendingPasswordItems,
  ),
};

export const staffResetRouteMocks = {
  resetStaffTempPassword: mock(
    async (_adminId: string, _userId: string): Promise<StaffCreateResult> =>
      routeStubs.resetStaffResult ?? {
        ok: true,
        user: {
          id: "u1",
          fullName: "Tran Van Tho",
          phone: "0901111222",
          email: "tho@example.com",
          role: "mechanic",
          status: "active",
          createdAt: null,
          avatarUrl: null,
        },
        tempPassword: "Abc123XyZ9",
      },
  ),
};

export const staffCryptoRouteMocks = {
  isTempCryptoConfigured: mock(
    (): boolean => routeStubs.pendingCryptoConfigured,
  ),
};

export const realtimePublishMocks = {
  publishRealtimeEvent: mock(
    async (_topic: string, _payload: unknown): Promise<void> => undefined,
  ),
};

export type AdminActionStub =
  | { ok: true; user: PublicUser }
  | { ok: false; status: number; errors: { form: string } };

export const adminUsersRouteMocks = {
  applyAdminUserAction: mock(
    async (
      _adminId: string,
      _userId: string,
      _action: string,
    ): Promise<AdminActionStub> =>
      routeStubs.adminActionResult ?? {
        ok: true,
        user: makePublicUser(),
      },
  ),
};

// The POST /api/bookings route only depends on the auth guard and the
// booking service, so suites drive both through these handles.
export const authorizationMocks = {
  requireAuth: mock(async () => {
    if (!routeStubs.bookingUser) {
      return {
        user: null,
        response: NextResponse.json(
          { errors: { form: "Vui lòng đăng nhập để tiếp tục." } },
          { status: 401 },
        ),
      } as const;
    }
    return { user: routeStubs.bookingUser, response: null } as const;
  }),
  requireRole: mock(async (...allowed: UserRole[]) => {
    const user = routeStubs.bookingUser;
    if (!user) {
      return {
        user: null,
        response: NextResponse.json(
          { errors: { form: "Vui lòng đăng nhập để tiếp tục." } },
          { status: 401 },
        ),
      } as const;
    }
    if (!allowed.includes(user.role)) {
      return {
        user: null,
        response: NextResponse.json(
          { errors: { form: "Bạn không có quyền truy cập." } },
          { status: 403 },
        ),
      } as const;
    }
    return { user, response: null } as const;
  }),
};

export const bookingServiceMocks = {
  createCustomerBooking: mock(
    async (
      _user: PublicUser,
      _input: CreateBookingInput,
    ): Promise<BookingResult<CreatedBooking>> =>
      routeStubs.bookingCreateResult ?? {
        ok: true,
        data: okCreatedBooking(),
      },
  ),
};

export const customerBookingServiceMocks = {
  listCustomerBookings: mock(
    async (
      _customerId: string,
      _params: unknown,
    ): Promise<WorkspaceResult<CursorPage<BookingSummary>>> =>
      routeStubs.bookingListResult ?? {
        ok: true,
        data: { items: [], nextCursor: null },
      },
  ),
};

// The GET /api/mechanics route only depends on the auth guard and the
// directory service, driven through these handles in its suite.
export const mechanicDirectoryServiceMocks = {
  listAvailableMechanics: mock(
    async (
      _params?: ListMechanicsParams,
    ): Promise<MechanicResult<MechanicDirectoryItem[]>> =>
      routeStubs.mechanicsList ?? {
        ok: true,
        data: [okMechanicDirectoryItem()],
      },
  ),
};

// The `/api/auth/me` route resolves the account status through this service,
// so route suites control "active / locked / deleted" with `routeStubs.meSession`.
export const accountStatusRouteMocks = {
  readAccountSession: mock(
    async (_token: string): Promise<AccountSession> =>
      routeStubs.meSession ?? okAccountSession(),
  ),
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
  routeStubs.pendingPasswordItems = [];
  routeStubs.pendingCryptoConfigured = true;
  routeStubs.resetStaffResult = null;
  routeStubs.adminActionResult = null;
  routeStubs.meSession = null;
  routeStubs.bookingUser = null;
  routeStubs.bookingCreateResult = null;
  routeStubs.bookingListResult = null;
  routeStubs.mechanicsList = null;
  routeStubs.workspaceResult = null;
  resetCatalogRouteMocks();
  resetMediaRouteMocks();
  for (const fn of Object.values(guardMocks)) fn.mockClear();
  for (const fn of Object.values(authServiceMocks)) fn.mockClear();
  for (const fn of Object.values(accountStatusRouteMocks)) fn.mockClear();
  for (const fn of Object.values(passwordChangeMocks)) fn.mockClear();
  for (const fn of Object.values(userSessionMocks)) fn.mockClear();
  for (const fn of Object.values(nextHeadersMocks)) fn.mockClear();
  for (const fn of Object.values(staffPendingRouteMocks)) fn.mockClear();
  for (const fn of Object.values(staffResetRouteMocks)) fn.mockClear();
  for (const fn of Object.values(staffCryptoRouteMocks)) fn.mockClear();
  for (const fn of Object.values(realtimePublishMocks)) fn.mockClear();
  for (const fn of Object.values(adminUsersRouteMocks)) fn.mockClear();
  for (const fn of Object.values(authorizationMocks)) fn.mockClear();
  for (const fn of Object.values(bookingServiceMocks)) fn.mockClear();
  for (const fn of Object.values(customerBookingServiceMocks)) fn.mockClear();
  for (const fn of Object.values(mechanicDirectoryServiceMocks)) fn.mockClear();
  for (const fn of Object.values(mediaStorageMocks)) fn.mockClear();
}
