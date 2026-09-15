import { mock } from "bun:test";

// Mutable stub state for the staff suites. Same pattern as the auth stubs
// in service-mocks.ts: tests mutate nothing here directly, they just assert
// on `mock.calls`. Split out to keep service-mocks.ts under the file limit.
export const staffRepoMocks = {
  setIdProfile: mock(
    async (
      _userId: string,
      _fullName: string,
      _updatedAt: Date,
    ): Promise<void> => undefined,
  ),
  setIdContacts: mock(
    async (
      _userId: string,
      _phone: string,
      _email: string,
      _updatedAt: Date,
    ): Promise<void> => undefined,
  ),
  setIdRole: mock(
    async (_userId: string, _role: string, _updatedAt: Date): Promise<void> =>
      undefined,
  ),
  setRoleProfile: mock(async (_params: unknown): Promise<void> => undefined),
  insertRoleRow: mock(async (_params: unknown): Promise<void> => undefined),
  deleteRoleRow: mock(
    async (
      _role: string,
      _monthBucket: string,
      _createdAt: Date,
      _userId: string,
    ): Promise<void> => undefined,
  ),
  deleteIdRow: mock(async (_userId: string): Promise<void> => undefined),
  deletePhoneRow: mock(async (_phone: string): Promise<void> => undefined),
  deleteEmailRow: mock(async (_email: string): Promise<void> => undefined),
};
