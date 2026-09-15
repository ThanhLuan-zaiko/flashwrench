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

// Pending temp-password storage stubs: the service under test encrypts
// before saving, so tests assert on mock.calls and drive reads via
// `staffTempStubs.rowByUser`.
export const staffTempStubs = {
  rowByUser: {} as Record<
    string,
    {
      user_id: string;
      temp_password_enc: string | null;
      created_at: Date | null;
      created_by: string | null;
    } | null
  >,
};

export const staffTempRepoMocks = {
  saveTempPassword: mock(
    async (_userId: string, _enc: string, _createdBy: string): Promise<void> =>
      undefined,
  ),
  findTempPassword: mock(
    async (
      userId: string,
    ): Promise<{
      user_id: string;
      temp_password_enc: string | null;
      created_at: Date | null;
      created_by: string | null;
    } | null> => staffTempStubs.rowByUser[userId] ?? null,
  ),
  deleteTempPassword: mock(async (_userId: string): Promise<void> => undefined),
};

// High-level pending helpers mocked in suites that only care that staff
// creation/cleanup happened, not how encryption works.
export const staffPendingMocks = {
  persistTempPassword: mock(
    async (
      _userId: string,
      _plain: string,
      _createdBy: string,
    ): Promise<void> => undefined,
  ),
  clearTempPassword: mock(async (_userId: string): Promise<void> => undefined),
};

// Passthrough crypto for orchestration suites: enc:plain keeps rows
// deterministic without WebCrypto. Real encryption is covered in unit.
export const staffTempCryptoMocks = {
  encryptTempPassword: mock(
    async (plain: string): Promise<string> => `enc:${plain}`,
  ),
  decryptTempPassword: mock(async (enc: string): Promise<string> => {
    if (!enc.startsWith("enc:"))
      throw new Error("Unknown temp password format.");
    return enc.slice("enc:".length);
  }),
};
