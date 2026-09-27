// Shared repository stubs for the public rescue suites. Tests mutate
// `rescueStubs` and assert on `mock.calls`. Nothing touches a real
// database. Extend these handles instead of inventing file-local mocks.
import { mock } from "bun:test";
import type { InsertRescueParams } from "@/lib/rescue/rescue.repository";

export const rescueStubs = {
  inserts: [] as InsertRescueParams[],
};

export const rescueRepoMocks = {
  insertRescueRequest: mock(
    async (params: InsertRescueParams): Promise<void> => {
      rescueStubs.inserts.push(params);
    },
  ),
};

export function resetRescueMocks(): void {
  rescueStubs.inserts = [];
  for (const fn of Object.values(rescueRepoMocks)) fn.mockClear();
}
