import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { PublicUser } from "@/lib/auth/user.types";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  guestRecordsNextHeadersMocks,
  guestRecordsRepoMocks,
  guestRecordsStubs,
  resetGuestRecordsMocks,
} from "../helpers/guest-records.mocks";

// Helpers first, mocks second, system under test last: the cookie jar, the
// browser index and the session guard are stubs, nothing reaches ScyllaDB.
const sessionStub = { user: null as PublicUser | null };
const authorizationMocks = {
  authenticateRequest: mock(async () => sessionStub.user),
};

mock.module("next/headers", () => guestRecordsNextHeadersMocks);
mock.module(
  "@/lib/guest-records/guest-records.repository",
  () => guestRecordsRepoMocks,
);
mock.module("@/lib/auth/authorization", () => authorizationMocks);

import { NextResponse } from "next/server";
import { GET as recentGet } from "@/app/api/guest-access/recent/route";
import { GUEST_COOKIE } from "@/lib/auth/guest-session.constants";
import { linkGuestRecordToBrowser } from "@/lib/guest-records/guest-records.route";
import { isUuid } from "@/lib/validation";

const GUEST_ID = "99999999-9999-4999-8999-999999999999";
const BOOKING_ID = "11111111-1111-4111-8111-111111111111";

function created(): NextResponse {
  return NextResponse.json({ ok: true }, { status: 201 });
}

beforeEach(() => {
  resetGuestRecordsMocks();
  sessionStub.user = null;
  authorizationMocks.authenticateRequest.mockClear();
});

describe("linkGuestRecordToBrowser", () => {
  test("indexes under the existing fw_gid and refreshes the cookie", async () => {
    guestRecordsStubs.cookies = { [GUEST_COOKIE]: GUEST_ID };
    const response = await linkGuestRecordToBrowser(
      created(),
      "booking",
      BOOKING_ID,
    );

    expect(response.status).toBe(201);
    expect(response.cookies.get(GUEST_COOKIE)?.value).toBe(GUEST_ID);
    expect(guestRecordsStubs.writes[0]).toMatchObject({
      guestId: GUEST_ID,
      recordType: "booking",
      recordId: BOOKING_ID,
    });
  });

  // A first-time visitor who books before ever touching the cart has no
  // token yet: one is minted so the next tab can find the booking.
  test("mints a token for a visitor without one", async () => {
    const response = await linkGuestRecordToBrowser(
      created(),
      "rescue",
      BOOKING_ID,
    );
    const minted = response.cookies.get(GUEST_COOKIE)?.value;
    expect(isUuid(minted)).toBe(true);
    expect(guestRecordsStubs.writes[0]?.guestId).toBe(minted as string);
  });

  test("keeps the 201 when the index write fails", async () => {
    guestRecordsStubs.cookies = { [GUEST_COOKIE]: GUEST_ID };
    guestRecordsStubs.putError = new Error("NoHostAvailable");
    const response = await linkGuestRecordToBrowser(
      created(),
      "order",
      BOOKING_ID,
    );
    expect(response.status).toBe(201);
    expect(response.cookies.get(GUEST_COOKIE)?.value).toBe(GUEST_ID);
  });

  test("keeps the 201 when the cookie jar is unavailable", async () => {
    guestRecordsNextHeadersMocks.cookies.mockImplementationOnce(async () => {
      throw new Error("outside request scope");
    });
    const response = await linkGuestRecordToBrowser(
      created(),
      "booking",
      BOOKING_ID,
    );
    expect(response.status).toBe(201);
    expect(guestRecordsRepoMocks.putGuestRecordRefByGid).not.toHaveBeenCalled();
  });
});

describe("GET /api/guest-access/recent", () => {
  test("signed-in visitors get an empty list without an index read", async () => {
    sessionStub.user = makePublicUser();
    guestRecordsStubs.cookies = { [GUEST_COOKIE]: GUEST_ID };
    const response = await recentGet();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ records: [] });
    expect(
      guestRecordsRepoMocks.listGuestRecordRefsByGid,
    ).not.toHaveBeenCalled();
  });

  test("guests read the partition named by their own cookie", async () => {
    guestRecordsStubs.cookies = { [GUEST_COOKIE]: GUEST_ID };
    const response = await recentGet();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ records: [] });
    expect(
      guestRecordsRepoMocks.listGuestRecordRefsByGid.mock.calls[0]?.[0],
    ).toBe(GUEST_ID);
  });

  test("a visitor without a token has no history", async () => {
    const response = await recentGet();
    expect(await response.json()).toEqual({ records: [] });
    expect(
      guestRecordsRepoMocks.listGuestRecordRefsByGid,
    ).not.toHaveBeenCalled();
  });

  test("an index outage is a 500 with a Vietnamese message", async () => {
    guestRecordsStubs.cookies = { [GUEST_COOKIE]: GUEST_ID };
    guestRecordsStubs.listError = new Error("NoHostAvailable");
    const response = await recentGet();
    expect(response.status).toBe(500);
    const body = (await response.json()) as { errors: { form: string } };
    expect(body.errors.form).toContain("Không tải được");
  });
});
