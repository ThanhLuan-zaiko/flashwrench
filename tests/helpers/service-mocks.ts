import { mock } from "bun:test";
import type { AdminRoleRow } from "@/lib/auth/admin-users.repository";
import type {
  RefreshSessionRow,
  UserSessionRow,
} from "@/lib/auth/refresh.repository";
import type {
  CreateUserOutcome,
  CreateUserParams,
  CreateUserWithRoleParams,
} from "@/lib/auth/user.repository";
import type { UserRow } from "@/lib/auth/user.types";
import type {
  ServiceByCategoryRow,
  ServiceCategoryRow,
  ServiceRow,
} from "@/lib/catalog/service-catalog.types";
import { makeUserRow } from "./auth.fixtures";
import { bookingRepoMocks, resetBookingMocks } from "./booking.mocks";
import { complaintRepoMocks, resetComplaintMocks } from "./complaint.mocks";
import {
  mechanicBookingsRepoMocks,
  mechanicWorkspaceRepoMocks,
  resetMechanicMocks,
} from "./mechanic.mocks";
import {
  staffPendingMocks,
  staffRepoMocks,
  staffTempCryptoMocks,
  staffTempRepoMocks,
  staffTempStubs,
} from "./staff.mocks";

export { staffRepoMocks };
export { bookingRepoMocks, bookingStubs } from "./booking.mocks";
export { complaintRepoMocks, complaintStubs } from "./complaint.mocks";
export {
  mechanicBookingsRepoMocks,
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
} from "./mechanic.mocks";
export {
  staffPendingMocks,
  staffTempCryptoMocks,
  staffTempRepoMocks,
  staffTempStubs,
} from "./staff.mocks";

// Mutable stub state for service-level suites. Factories in the test files
// return these handles, so each test reconfigures behavior by mutating
// `serviceStubs` and asserting on `mock.calls`. Nothing here touches a real
// database or hasher.
//
// Isolation note: `bun test` shares one module registry per process, so
// `mock.module` calls leak across files of the same run. Every test file
// therefore runs in its own process (see `tests/run-suite.sh`, used by the
// `test:*` scripts). Never rely on cross-file ordering; extend these shared
// handles instead of inventing file-local mocks for the same modules.

export const serviceStubs = {
  phoneOwner: null as string | null,
  emailOwner: null as string | null,
  userById: null as UserRow | null,
  createUserOutcome: { ok: true } as CreateUserOutcome,
  sessionRow: null as RefreshSessionRow | null,
  rotateApplied: true,
  userSessions: [] as UserSessionRow[],
};

export const userRepoMocks = {
  findUserById: mock(
    async (_userId: string): Promise<UserRow | null> => serviceStubs.userById,
  ),
  findUserIdByPhone: mock(
    async (_phone: string): Promise<string | null> => serviceStubs.phoneOwner,
  ),
  findUserIdByEmail: mock(
    async (_email: string): Promise<string | null> => serviceStubs.emailOwner,
  ),
  createUser: mock(
    async (_params: CreateUserParams): Promise<CreateUserOutcome> =>
      serviceStubs.createUserOutcome,
  ),
  createUserWithRole: mock(
    async (_params: CreateUserWithRoleParams): Promise<CreateUserOutcome> =>
      serviceStubs.createUserOutcome,
  ),
  claimPhone: mock(
    async (_phone: string, _userId: string): Promise<boolean> => true,
  ),
  claimEmail: mock(
    async (_email: string, _userId: string): Promise<boolean> => true,
  ),
  releasePhone: mock(async (_phone: string): Promise<void> => undefined),
  releaseEmail: mock(async (_email: string): Promise<void> => undefined),
  bumpTokenVersion: mock(async (_userId: string): Promise<number> => 1),
  updatePassword: mock(
    async (_userId: string, _hash: string): Promise<void> => undefined,
  ),
};

export const refreshRepoMocks = {
  createSession: mock(
    async (_params: {
      userId: string;
      familyId: string;
      tokenHash: string;
      deviceLabel: string;
    }): Promise<void> => undefined,
  ),
  findSession: mock(
    async (
      _userId: string,
      _familyId: string,
    ): Promise<RefreshSessionRow | null> => serviceStubs.sessionRow,
  ),
  listSessionsByUser: mock(
    async (_userId: string): Promise<UserSessionRow[]> =>
      serviceStubs.userSessions,
  ),
  rotateSessionCas: mock(
    async (_params: {
      userId: string;
      familyId: string;
      expectedHash: string;
      expectedColumn: "token_hash" | "previous_token_hash";
      newHash: string;
      storePreviousHash: string;
    }): Promise<boolean> => serviceStubs.rotateApplied,
  ),
  touchSessionIndex: mock(
    async (_params: {
      userId: string;
      familyId: string;
      createdAt: Date;
      deviceLabel: string;
    }): Promise<void> => undefined,
  ),
  deleteSession: mock(
    async (
      _userId: string,
      _familyId: string,
      _createdAt?: Date | null,
    ): Promise<void> => undefined,
  ),
};

export const passwordMocks = {
  hashPassword: mock(
    async (password: string): Promise<string> => `hashed:${password}`,
  ),
  verifyPassword: mock(
    async (plain: string, hash: string): Promise<boolean> =>
      hash === `hashed:${plain}`,
  ),
};

export function defaultUserRow(): UserRow {
  return makeUserRow();
}

export const adminStubs = {
  rolePages: [] as AdminRoleRow[],
};

export const adminUsersRepoMocks = {
  listRolePage: mock(
    async (
      _role: string,
      _monthBucket: string,
      _limit: number,
    ): Promise<AdminRoleRow[]> => adminStubs.rolePages,
  ),
  setIdStatus: mock(
    async (
      _userId: string,
      _status: string,
      _tokenVersion: number | null,
      _updatedAt: Date,
    ): Promise<void> => undefined,
  ),
  setRoleStatus: mock(
    async (
      _role: string,
      _monthBucket: string,
      _createdAt: Date,
      _userId: string,
      _status: string,
    ): Promise<void> => undefined,
  ),
};

export function resetServiceMocks(): void {
  serviceStubs.phoneOwner = null;
  serviceStubs.emailOwner = null;
  serviceStubs.userById = null;
  serviceStubs.createUserOutcome = { ok: true };
  serviceStubs.sessionRow = null;
  serviceStubs.rotateApplied = true;
  serviceStubs.userSessions = [];
  adminStubs.rolePages = [];
  catalogStubs.categoryRows = [];
  catalogStubs.categoryById = null;
  catalogStubs.categorySlugOwner = null;
  catalogStubs.categorySlugClaimed = true;
  catalogStubs.serviceRows = [];
  catalogStubs.serviceById = null;
  catalogStubs.serviceSlugOwner = null;
  catalogStubs.serviceSlugClaimed = true;
  catalogStubs.serviceByCategoryRows = [];
  resetMechanicMocks();
  resetComplaintMocks();
  resetBookingMocks();
  staffTempStubs.rowByUser = {};
  for (const fn of Object.values(userRepoMocks)) fn.mockClear();
  for (const fn of Object.values(staffRepoMocks)) fn.mockClear();
  for (const fn of Object.values(staffTempRepoMocks)) fn.mockClear();
  for (const fn of Object.values(staffPendingMocks)) fn.mockClear();
  for (const fn of Object.values(staffTempCryptoMocks)) fn.mockClear();
  for (const fn of Object.values(refreshRepoMocks)) fn.mockClear();
  for (const fn of Object.values(passwordMocks)) fn.mockClear();
  for (const fn of Object.values(adminUsersRepoMocks)) fn.mockClear();
  for (const fn of Object.values(categoryRepoMocks)) fn.mockClear();
  for (const fn of Object.values(catalogServiceRepoMocks)) fn.mockClear();
  for (const fn of Object.values(complaintRepoMocks)) fn.mockClear();
  for (const fn of Object.values(mechanicBookingsRepoMocks)) fn.mockClear();
  for (const fn of Object.values(mechanicWorkspaceRepoMocks)) fn.mockClear();
  for (const fn of Object.values(bookingRepoMocks)) fn.mockClear();
}

// Mutable stub state for the catalog suites (service-categories + services).
// Same pattern as the auth stubs above: tests mutate `catalogStubs` and
// assert on `mock.calls`. Nothing touches a real database.
export const catalogStubs = {
  categoryRows: [] as ServiceCategoryRow[],
  categoryById: null as ServiceCategoryRow | null,
  categorySlugOwner: null as string | null,
  categorySlugClaimed: true,
  serviceRows: [] as ServiceRow[],
  serviceById: null as ServiceRow | null,
  serviceSlugOwner: null as string | null,
  serviceSlugClaimed: true,
  serviceByCategoryRows: [] as ServiceByCategoryRow[],
};

export const categoryRepoMocks = {
  listCategoryRows: mock(
    async (): Promise<ServiceCategoryRow[]> => catalogStubs.categoryRows,
  ),
  findCategoryRowById: mock(
    async (_categoryId: string): Promise<ServiceCategoryRow | null> =>
      catalogStubs.categoryById,
  ),
  findCategoryIdBySlug: mock(
    async (_slug: string): Promise<string | null> =>
      catalogStubs.categorySlugOwner,
  ),
  insertCategory: mock(async (_params: unknown): Promise<void> => undefined),
  updateCategoryRow: mock(async (_params: unknown): Promise<void> => undefined),
  claimCategorySlug: mock(
    async (_slug: string, _categoryId: string): Promise<boolean> =>
      catalogStubs.categorySlugClaimed,
  ),
  releaseCategorySlug: mock(
    async (_slug: string, _categoryId: string): Promise<boolean> => true,
  ),
  setCategoryActive: mock(
    async (
      _categoryId: string,
      _isActive: boolean,
      _updatedAt: Date,
    ): Promise<void> => undefined,
  ),
  setCategoryDeleted: mock(
    async (
      _categoryId: string,
      _isDeleted: boolean,
      _deletedAt: Date | null,
      _updatedAt: Date,
    ): Promise<void> => undefined,
  ),
  hardDeleteCategory: mock(
    async (_categoryId: string, _slug: string): Promise<void> => undefined,
  ),
};

export const catalogServiceRepoMocks = {
  listServiceRows: mock(
    async (): Promise<ServiceRow[]> => catalogStubs.serviceRows,
  ),
  findServiceRowById: mock(
    async (_serviceId: string): Promise<ServiceRow | null> =>
      catalogStubs.serviceById,
  ),
  findServiceIdBySlug: mock(
    async (_slug: string): Promise<string | null> =>
      catalogStubs.serviceSlugOwner,
  ),
  listServiceRowsByCategory: mock(
    async (_categoryId: string): Promise<ServiceByCategoryRow[]> =>
      catalogStubs.serviceByCategoryRows,
  ),
  insertService: mock(async (_params: unknown): Promise<void> => undefined),
  updateServiceRows: mock(async (_params: unknown): Promise<void> => undefined),
  setServiceActive: mock(
    async (
      _serviceId: string,
      _categoryId: string,
      _isActive: boolean,
    ): Promise<void> => undefined,
  ),
  setServiceDeleted: mock(
    async (
      _serviceId: string,
      _categoryId: string,
      _isDeleted: boolean,
      _deletedAt: Date | null,
    ): Promise<void> => undefined,
  ),
  hardDeleteService: mock(
    async (
      _serviceId: string,
      _categoryId: string,
      _slug: string,
    ): Promise<void> => undefined,
  ),
  claimServiceSlug: mock(
    async (_slug: string, _serviceId: string): Promise<boolean> =>
      catalogStubs.serviceSlugClaimed,
  ),
  releaseServiceSlug: mock(
    async (_slug: string, _serviceId: string): Promise<boolean> => true,
  ),
  bulkRefreshServiceCategoryName: mock(
    async (_serviceIds: string[], _categoryName: string): Promise<void> =>
      undefined,
  ),
};
