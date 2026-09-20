import { mock } from "bun:test";
import type { ComplaintRow } from "@/lib/complaints/complaint.types";

// Mutable stub state for the complaint suites. Same pattern as the auth
// stubs in service-mocks.ts: tests mutate `complaintStubs` and assert on
// `mock.calls`. Split out to keep service-mocks.ts under the file limit.
export const complaintStubs = {
  complaintRows: [] as ComplaintRow[],
  complaintById: null as ComplaintRow | null,
};

export const complaintRepoMocks = {
  listComplaintRows: mock(
    async (): Promise<ComplaintRow[]> => complaintStubs.complaintRows,
  ),
  findComplaintRowById: mock(
    async (_complaintId: string): Promise<ComplaintRow | null> =>
      complaintStubs.complaintById,
  ),
  insertComplaint: mock(async (_params: unknown): Promise<void> => undefined),
  updateComplaintStatus: mock(
    async (_params: unknown): Promise<void> => undefined,
  ),
};

export const complaintServiceMocks = {
  listComplaints: mock(async (..._args: unknown[]) => ({
    ok: true as const,
    data: [],
  })),
  createComplaint: mock(async (..._args: unknown[]) => ({
    ok: true as const,
    data: { id: "c0mp1aint-1111-4111-8111-000000000000", subject: "subject" },
  })),
};

export function resetComplaintMocks(): void {
  complaintStubs.complaintRows = [];
  complaintStubs.complaintById = null;
  for (const fn of Object.values(complaintRepoMocks)) fn.mockClear();
  for (const fn of Object.values(complaintServiceMocks)) fn.mockClear();
}
