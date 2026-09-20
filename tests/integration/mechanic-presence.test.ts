import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser, makeUserRow } from "../helpers/auth.fixtures";
import { MECHANIC_ID, makeProfileRow } from "../helpers/mechanic.fixtures";
import {
  mechanicDirectoryRepoMocks,
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import { serviceStubs, userRepoMocks } from "../helpers/service-mocks";
import {
  mechanicProfileRepoMocks,
  realtimePublishMocks,
  resetWorkspaceMocks,
  workspaceStubs,
} from "../helpers/workspace.mocks";

mock.module(
  "@/lib/mechanic/mechanic-workspace.repository",
  () => mechanicWorkspaceRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-profile.repository",
  () => mechanicProfileRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-directory.repository",
  () => mechanicDirectoryRepoMocks,
);
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module("@/lib/realtime/publish", () => realtimePublishMocks);

import {
  getMechanicPresence,
  updateMechanicProfilePresence,
} from "@/lib/mechanic/mechanic-profile.service";

const mechanic = makePublicUser({
  id: MECHANIC_ID,
  role: "mechanic",
  status: "active",
});

function presenceBody(overrides?: Record<string, unknown>) {
  return {
    online: true,
    skills: ["engine", "tire"],
    baseLat: 10.775,
    baseLng: 106.7,
    ...overrides,
  };
}

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
  mechanicStubs.profile = makeProfileRow();
  serviceStubs.userById = makeUserRow({ role: "mechanic", status: "active" });
});

describe("updateMechanicProfilePresence", () => {
  test("rejects dispatcher, admin and customer actors", async () => {
    for (const role of ["dispatcher", "admin", "customer"] as const) {
      const result = await updateMechanicProfilePresence(
        makePublicUser({ role }),
        presenceBody(),
      );
      expect(result).toMatchObject({ ok: false, status: 403 });
    }
    expect(
      mechanicProfileRepoMocks.updateMechanicPresence.mock.calls.length,
    ).toBe(0);
  });

  test("rejects a locked mechanic account", async () => {
    const result = await updateMechanicProfilePresence(
      makePublicUser({ id: MECHANIC_ID, role: "mechanic", status: "locked" }),
      presenceBody(),
    );
    expect(result).toMatchObject({ ok: false, status: 403 });
  });

  test("persists presence and signals all three topics", async () => {
    const result = await updateMechanicProfilePresence(
      mechanic,
      presenceBody({ verified: true, baseLat: 10.9 }),
    );
    expect(result.ok).toBe(true);

    const update = workspaceStubs.presenceUpdates[0];
    expect(update).toMatchObject({
      mechanicId: MECHANIC_ID,
      isOnline: true,
      isVerified: true,
      baseLat: 10.9,
      baseLng: 106.7,
      skills: ["engine", "tire"],
    });

    const topics = workspaceStubs.published.map((entry) => entry.topic);
    expect(topics).toContain("mechanic-directory");
    expect(topics).toContain("operations");
    expect(topics).toContain(`user:${MECHANIC_ID}`);
    const directoryEvent = workspaceStubs.published.find(
      (entry) => entry.topic === "mechanic-directory",
    );
    expect(directoryEvent?.payload).toEqual({ kind: "mechanic-updated" });
  });

  test("client-supplied verified is ignored; the server derives it", async () => {
    const result = await updateMechanicProfilePresence(
      mechanic,
      presenceBody({ verified: false }),
    );
    expect(result.ok).toBe(true);
    expect(workspaceStubs.presenceUpdates[0]?.isVerified).toBe(true);
    if (result.ok) expect(result.data.verified).toBe(true);
  });

  test("rejects false, array and null coordinates without writing", async () => {
    for (const coords of [
      { baseLat: false },
      { baseLat: [10] },
      { baseLat: "east" },
      { baseLat: 91 },
      { baseLng: undefined },
    ]) {
      const result = await updateMechanicProfilePresence(
        mechanic,
        presenceBody(coords),
      );
      expect(result).toMatchObject({ ok: false, status: 400 });
    }
    expect(
      mechanicProfileRepoMocks.updateMechanicPresence.mock.calls.length,
    ).toBe(0);
    expect(workspaceStubs.published).toHaveLength(0);
  });

  test("offline updates clear without forcing availability", async () => {
    const result = await updateMechanicProfilePresence(mechanic, {
      online: false,
      skills: ["engine"],
      baseLat: null,
      baseLng: null,
    });
    expect(result.ok).toBe(true);
    const update = workspaceStubs.presenceUpdates[0];
    expect(update).toMatchObject({ isOnline: false, baseLat: null });
    expect(
      Object.keys(update as unknown as Record<string, unknown>),
    ).not.toContain("isAvailable");
  });

  test("initializes a missing profile lazily, offline by default", async () => {
    mechanicStubs.profile = null;
    mechanicStubs.profileReadQueue = [
      null,
      makeProfileRow({ is_online: false, is_available: true }),
    ];
    const result = await getMechanicPresence(mechanic);
    expect(result.ok).toBe(true);
    expect(workspaceStubs.profileInit[0]).toMatchObject({
      mechanicId: MECHANIC_ID,
      isOnline: false,
      isAvailable: true,
      isVerified: true,
    });
    if (result.ok) {
      expect(result.data.online).toBe(false);
      expect(result.data.available).toBe(true);
    }
  });
});
