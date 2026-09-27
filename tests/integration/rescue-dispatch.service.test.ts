import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeUserRow } from "../helpers/auth.fixtures";
import {
  MECHANIC_ID,
  makeAvailableMechanicRow,
  makeProfileRow,
} from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicDirectoryRepoMocks,
  mechanicDirectoryStubs,
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import {
  makeRescueRow,
  rescueConfigMocks,
  rescueConfigStubs,
  rescueStubs,
  rescueWorkflowRepoMocks,
  resetRescueMocks,
} from "../helpers/rescue.mocks";
import { serviceStubs, userRepoMocks } from "../helpers/service-mocks";
import {
  domainPublishMocks,
  resetWorkspaceMocks,
} from "../helpers/workspace.mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports. Dispatch reads the rescue row, lists the
// mechanic directory, checks eligibility, then claims the offer.
mock.module(
  "@/lib/rescue/rescue-workflow.repository",
  () => rescueWorkflowRepoMocks,
);
mock.module("@/lib/rescue/rescue-config.service", () => rescueConfigMocks);
mock.module(
  "@/lib/mechanic/mechanic-directory.repository",
  () => mechanicDirectoryRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-workspace.repository",
  () => mechanicWorkspaceRepoMocks,
);
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);

import {
  autoDispatchRescue,
  expireRescueOffer,
} from "@/lib/rescue/rescue-dispatch.service";

const REQUEST_ID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  resetRescueMocks();
  resetMechanicMocks();
  resetWorkspaceMocks();
  serviceStubs.userById = makeUserRow({ role: "mechanic", status: "active" });
  mechanicStubs.profile = makeProfileRow();
  mechanicDirectoryStubs.rows = [makeAvailableMechanicRow()];
});

describe("autoDispatchRescue", () => {
  test("offers the open rescue to the nearest mechanic", async () => {
    rescueStubs.rowById = makeRescueRow({ status: "open" });

    const outcome = await autoDispatchRescue(REQUEST_ID);

    expect(outcome).toMatchObject({ mechanicId: MECHANIC_ID });
    expect(typeof outcome?.offerExpiresAt).toBe("string");
    expect(rescueStubs.transitions[0]).toMatchObject({
      status: "dispatched",
      mechanicId: MECHANIC_ID,
    });
    expect(domainPublishMocks.publishRescueChange.mock.calls[0]?.[0]).toBe(
      "rescue-assigned",
    );
  });

  test("broadcasts by rating order without a map pin", async () => {
    rescueStubs.rowById = makeRescueRow({
      status: "open",
      address_lat: null,
      address_lng: null,
    });

    const outcome = await autoDispatchRescue(REQUEST_ID);

    expect(outcome?.mechanicId).toBe(MECHANIC_ID);
  });

  test("skips declined mechanics and stays open when nobody is free", async () => {
    rescueStubs.rowById = makeRescueRow({ status: "open" });
    rescueStubs.historyRows = [
      {
        request_id: REQUEST_ID,
        changed_at: new Date(),
        old_status: "dispatched",
        new_status: "open",
        changed_by: MECHANIC_ID,
        note: "declined",
      },
    ];

    const outcome = await autoDispatchRescue(REQUEST_ID);

    expect(outcome).toBeNull();
    expect(rescueStubs.transitions).toHaveLength(0);
  });

  test("stops when declines pass the admin re-offer cap", async () => {
    rescueConfigStubs.values = {
      offerTimeoutMs: 30_000,
      maxReoffers: 0,
      candidateLimit: 50,
      isDefault: false,
      updatedAt: new Date().toISOString(),
    };
    rescueStubs.rowById = makeRescueRow({ status: "open" });
    rescueStubs.historyRows = [
      {
        request_id: REQUEST_ID,
        changed_at: new Date(),
        old_status: "dispatched",
        new_status: "open",
        changed_by: MECHANIC_ID,
        note: "declined",
      },
    ];

    const outcome = await autoDispatchRescue(REQUEST_ID);

    expect(outcome).toBeNull();
    expect(rescueStubs.transitions).toHaveLength(0);
  });

  test("ignores non-open rows without touching storage", async () => {
    rescueStubs.rowById = makeRescueRow({
      status: "dispatched",
      assigned_mechanic_id: MECHANIC_ID,
    });

    const outcome = await autoDispatchRescue(REQUEST_ID);

    expect(outcome).toBeNull();
    expect(rescueStubs.transitions).toHaveLength(0);
  });
});

describe("expireRescueOffer", () => {
  test("re-offers the next mechanic after 30s", async () => {
    const start = new Date("2026-01-01T00:00:00Z");
    rescueStubs.rowById = makeRescueRow({
      status: "dispatched",
      assigned_mechanic_id: MECHANIC_ID,
      assigned_mechanic_name: "Nguyen Van A",
      updated_at: start,
    });
    mechanicDirectoryStubs.rows = [
      makeAvailableMechanicRow(),
      makeAvailableMechanicRow({
        mechanic_id: "88888888-8888-4888-8888-888888888888",
        display_name: "Tran Van B",
      }),
    ];
    mechanicStubs.profilesById.set(
      "88888888-8888-4888-8888-888888888888",
      makeProfileRow({
        mechanic_id: "88888888-8888-4888-8888-888888888888",
        display_name: "Tran Van B",
      }),
    );

    const result = await expireRescueOffer(
      REQUEST_ID,
      new Date(start.getTime() + 30_000),
    );

    expect(result.expired).toBe(true);
    expect(rescueStubs.transitions[0]).toMatchObject({ status: "open" });
  });

  test("keeps fresh offers untouched", async () => {
    const start = new Date("2026-01-01T00:00:00Z");
    rescueStubs.rowById = makeRescueRow({
      status: "dispatched",
      assigned_mechanic_id: MECHANIC_ID,
      updated_at: start,
    });

    const result = await expireRescueOffer(
      REQUEST_ID,
      new Date(start.getTime() + 10_000),
    );

    expect(result).toEqual({ expired: false });
    expect(rescueStubs.transitions).toHaveLength(0);
  });
});
