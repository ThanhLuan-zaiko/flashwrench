import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  refreshRepoMocks,
  resetServiceMocks,
  serviceStubs,
} from "../helpers/service-mocks";

// Helpers first, mocks second, system under test last: the repository is the
// only side effect, so the shared handle drives every case.
mock.module("@/lib/auth/refresh.repository", () => refreshRepoMocks);

import { revokeUserSessions } from "@/lib/auth/session-revoke.service";

beforeEach(() => {
  resetServiceMocks();
});

describe("revokeUserSessions", () => {
  test("deletes every refresh family of the account", async () => {
    const createdAt = new Date("2026-09-01T00:00:00.000Z");
    serviceStubs.userSessions = [
      {
        family_id: "family-1",
        device_label: "Chrome",
        created_at: createdAt,
        expires_at: null,
      },
      {
        family_id: "family-2",
        device_label: null,
        created_at: null,
        expires_at: null,
      },
    ];

    await revokeUserSessions("user-1");

    expect(refreshRepoMocks.listSessionsByUser.mock.calls[0]?.[0]).toBe(
      "user-1",
    );
    expect(refreshRepoMocks.deleteSession.mock.calls).toEqual([
      ["user-1", "family-1", createdAt],
      ["user-1", "family-2", null],
    ]);
  });

  test("does nothing for an account without sessions", async () => {
    await revokeUserSessions("user-1");
    expect(refreshRepoMocks.deleteSession.mock.calls.length).toBe(0);
  });

  test("stays best-effort when the family index read fails", async () => {
    refreshRepoMocks.listSessionsByUser.mockImplementationOnce(async () => {
      throw new Error("scylla down");
    });
    await revokeUserSessions("user-1");
    expect(refreshRepoMocks.deleteSession.mock.calls.length).toBe(0);
  });

  test("keeps deleting other families when one delete fails", async () => {
    serviceStubs.userSessions = [
      {
        family_id: "family-1",
        device_label: null,
        created_at: null,
        expires_at: null,
      },
      {
        family_id: "family-2",
        device_label: null,
        created_at: null,
        expires_at: null,
      },
    ];
    refreshRepoMocks.deleteSession.mockImplementationOnce(async () => {
      throw new Error("write timeout");
    });

    await revokeUserSessions("user-1");

    expect(refreshRepoMocks.deleteSession.mock.calls.length).toBe(2);
    expect(refreshRepoMocks.deleteSession.mock.calls[1]?.[1]).toBe("family-2");
  });
});
