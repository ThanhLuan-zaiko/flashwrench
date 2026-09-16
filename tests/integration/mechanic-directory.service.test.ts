import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  MECHANIC_ID,
  MECHANIC_OTHER_ID,
  makeAvailableMechanicRow,
  makeProfileRow,
} from "../helpers/mechanic.fixtures";
import {
  mechanicDirectoryRepoMocks,
  mechanicDirectoryStubs,
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports. The directory service reads one bounded
// partition and the live profile, both stubbed here.
mock.module(
  "@/lib/mechanic/mechanic-directory.repository",
  () => mechanicDirectoryRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-workspace.repository",
  () => mechanicWorkspaceRepoMocks,
);

import {
  listAvailableMechanics,
  syncMechanicDirectory,
} from "@/lib/mechanic/mechanic-directory.service";

beforeEach(() => {
  resetMechanicMocks();
});

describe("listAvailableMechanics", () => {
  test("skips unverified and offline rows", async () => {
    mechanicDirectoryStubs.rows = [
      makeAvailableMechanicRow(),
      makeAvailableMechanicRow({
        mechanic_id: MECHANIC_OTHER_ID,
        display_name: "Hidden Tho",
        is_verified: false,
      }),
      makeAvailableMechanicRow({
        mechanic_id: "99999999-9999-4999-8999-999999999999",
        display_name: "Offline Bao",
        is_online: false,
      }),
    ];

    const result = await listAvailableMechanics();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.map((item) => item.id)).toEqual([MECHANIC_ID]);
    expect(result.data[0]).toMatchObject({
      displayName: "Nguyen Van A",
      ratingAvg: 4.8,
      completedJobs: 30,
    });
  });

  test("sorts nearest-first when the customer location is known", async () => {
    mechanicDirectoryStubs.rows = [
      makeAvailableMechanicRow({ base_lat: 10.9, base_lng: 106.9 }),
      makeAvailableMechanicRow({
        mechanic_id: MECHANIC_OTHER_ID,
        display_name: "Near Tho",
        base_lat: 10.776,
        base_lng: 106.701,
      }),
    ];

    const result = await listAvailableMechanics({
      lat: 10.7769,
      lng: 106.7009,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.map((item) => item.id)).toEqual([
      MECHANIC_OTHER_ID,
      MECHANIC_ID,
    ]);
    expect(result.data[0]?.distanceKm).not.toBeNull();
  });

  test("rejects half or wild coordinates with 400", async () => {
    const half = await listAvailableMechanics({ lat: 10.7769 });
    expect(half.ok).toBe(false);
    if (half.ok) return;
    expect(half.status).toBe(400);

    const wild = await listAvailableMechanics({ lat: 120, lng: 106.7 });
    expect(wild.ok).toBe(false);
    if (wild.ok) return;
    expect(wild.status).toBe(400);
  });
});

describe("syncMechanicDirectory", () => {
  test("lists a verified, online, available mechanic", async () => {
    mechanicStubs.profile = makeProfileRow({ rating_avg: 4.8 });

    await syncMechanicDirectory(MECHANIC_ID);

    expect(
      mechanicDirectoryRepoMocks.upsertAvailableMechanic.mock.calls.length,
    ).toBe(1);
    expect(
      mechanicDirectoryRepoMocks.deleteAvailableMechanic.mock.calls.length,
    ).toBe(0);
  });

  test("removes a busy mechanic reusing the live rating key", async () => {
    mechanicStubs.profile = makeProfileRow({
      is_available: false,
      rating_avg: 4.8,
    });

    await syncMechanicDirectory(MECHANIC_ID);

    expect(
      mechanicDirectoryRepoMocks.deleteAvailableMechanic.mock.calls[0],
    ).toEqual([4.8, MECHANIC_ID]);
    expect(
      mechanicDirectoryRepoMocks.upsertAvailableMechanic.mock.calls.length,
    ).toBe(0);
  });

  test("removes a deleted profile without failing", async () => {
    mechanicStubs.profile = null;

    await syncMechanicDirectory(MECHANIC_ID);

    expect(
      mechanicDirectoryRepoMocks.deleteAvailableMechanic.mock.calls[0],
    ).toEqual([null, MECHANIC_ID]);
  });
});
