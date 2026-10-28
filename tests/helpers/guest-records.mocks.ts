// Shared stubs for the browser-keyed guest record index (fw_gid). Suites
// drive `guestRecordsStubs` and assert on `mock.calls`; nothing touches a
// real database or a real cookie jar.
import { mock } from "bun:test";
import type { NextResponse } from "next/server";
import type { GuestRecordType } from "@/lib/guest-access/guest-access.types";
import type {
  GuestGidRecordRef,
  PutGuestGidRecordRef,
} from "@/lib/guest-records/guest-records.types";

export const guestRecordsStubs = {
  refs: [] as GuestGidRecordRef[],
  writes: [] as PutGuestGidRecordRef[],
  putError: null as Error | null,
  listError: null as Error | null,
  /** Cookie jar for the next/headers stub, keyed by cookie name. */
  cookies: {} as Record<string, string>,
};

export const guestRecordsRepoMocks = {
  putGuestRecordRefByGid: mock(
    async (write: PutGuestGidRecordRef): Promise<void> => {
      if (guestRecordsStubs.putError) throw guestRecordsStubs.putError;
      guestRecordsStubs.writes.push(write);
    },
  ),
  listGuestRecordRefsByGid: mock(
    async (_guestId: string, limit: number): Promise<GuestGidRecordRef[]> => {
      if (guestRecordsStubs.listError) throw guestRecordsStubs.listError;
      return guestRecordsStubs.refs.slice(0, limit);
    },
  ),
};

export const guestRecordsNextHeadersMocks = {
  cookies: mock(async () => ({
    get: (name: string): { value: string } | undefined => {
      const value = guestRecordsStubs.cookies[name];
      return value === undefined ? undefined : { value };
    },
  })),
};

// Route suites stub the glue itself: the handler's only job is to call it
// for anonymous callers and hand back what it returns.
export const guestRecordsRouteMocks = {
  linkGuestRecordToBrowser: mock(
    async <T extends NextResponse>(
      response: T,
      _recordType: GuestRecordType,
      _recordId: string,
    ): Promise<T> => response,
  ),
};

export function resetGuestRecordsMocks(): void {
  guestRecordsStubs.refs = [];
  guestRecordsStubs.writes = [];
  guestRecordsStubs.putError = null;
  guestRecordsStubs.listError = null;
  guestRecordsStubs.cookies = {};
  for (const fn of Object.values(guestRecordsRepoMocks)) fn.mockClear();
  for (const fn of Object.values(guestRecordsNextHeadersMocks)) fn.mockClear();
  for (const fn of Object.values(guestRecordsRouteMocks)) fn.mockClear();
}
