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
// mock.module above imports. The sweep runs the real dispatch service, so
// the same repositories and config mocks as rescue-dispatch apply here.
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
  redispatchOpenRescues,
  sweepExpiredRescueOffers,
} from "@/lib/rescue/rescue-sweep.service";

const REQUEST_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_REQUEST_ID = "22222222-2222-2222-2222-222222222222";
const OFFER_AGE_MS = 60_000;

function ref(requestId: string, status: string) {
  return { status, created_at: new Date(), request_id: requestId };
}

beforeEach(() => {
  resetRescueMocks();
  resetMechanicMocks();
  resetWorkspaceMocks();
  serviceStubs.userById = makeUserRow({ role: "mechanic", status: "active" });
  mechanicStubs.profile = makeProfileRow();
  mechanicDirectoryStubs.rows = [];
});

describe("sweepExpiredRescueOffers", () => {
  test("expires an overdue offer and re-offers it", async () => {
    rescueWorkflowRepoMocks.listRescueRefsByStatus.mockImplementationOnce(
      async () => ({ rows: [ref(REQUEST_ID, "dispatched")], pageState: null }),
    );
    rescueStubs.rowReadQueue = [
      makeRescueRow({
        status: "dispatched",
        assigned_mechanic_id: MECHANIC_ID,
        updated_at: new Date(Date.now() - OFFER_AGE_MS),
      }),
    ];
    rescueStubs.rowById = makeRescueRow({ status: "open" });

    const expired = await sweepExpiredRescueOffers();

    expect(expired).toBe(1);
    expect(
      rescueWorkflowRepoMocks.listRescueRefsByStatus.mock.calls[0]?.[0],
    ).toBe("dispatched");
    expect(rescueStubs.transitions[0]).toMatchObject({
      status: "open",
      mechanicId: null,
    });
  });

  test("leaves an offer that is still inside its lifetime alone", async () => {
    rescueWorkflowRepoMocks.listRescueRefsByStatus.mockImplementationOnce(
      async () => ({ rows: [ref(REQUEST_ID, "dispatched")], pageState: null }),
    );
    rescueStubs.rowById = makeRescueRow({
      status: "dispatched",
      assigned_mechanic_id: MECHANIC_ID,
      updated_at: new Date(),
    });

    const expired = await sweepExpiredRescueOffers();

    expect(expired).toBe(0);
    expect(rescueStubs.transitions).toHaveLength(0);
  });

  test("a failing row does not stop the rest of the sweep", async () => {
    rescueWorkflowRepoMocks.listRescueRefsByStatus.mockImplementationOnce(
      async () => ({
        rows: [
          ref(REQUEST_ID, "dispatched"),
          ref(OTHER_REQUEST_ID, "dispatched"),
        ],
        pageState: null,
      }),
    );
    rescueWorkflowRepoMocks.findRescueRowById.mockImplementationOnce(
      async () => {
        throw new Error("scylla timeout");
      },
    );
    rescueStubs.rowReadQueue = [
      makeRescueRow({
        request_id: OTHER_REQUEST_ID,
        status: "dispatched",
        assigned_mechanic_id: MECHANIC_ID,
        updated_at: new Date(Date.now() - OFFER_AGE_MS),
      }),
    ];
    rescueStubs.rowById = makeRescueRow({ status: "open" });

    const expired = await sweepExpiredRescueOffers();

    expect(expired).toBe(1);
    expect(rescueStubs.transitions[0]?.before.request_id).toBe(
      OTHER_REQUEST_ID,
    );
  });
});

describe("redispatchOpenRescues", () => {
  test("offers open rescues to a mechanic who just came online", async () => {
    mechanicDirectoryStubs.rows = [makeAvailableMechanicRow()];
    rescueWorkflowRepoMocks.listRescueRefsByStatus.mockImplementationOnce(
      async () => ({ rows: [ref(REQUEST_ID, "open")], pageState: null }),
    );
    rescueStubs.rowById = makeRescueRow({ status: "open" });

    const assigned = await redispatchOpenRescues();

    expect(
      rescueWorkflowRepoMocks.listRescueRefsByStatus.mock.calls[0]?.[0],
    ).toBe("open");
    expect(assigned).toBe(1);
    expect(rescueStubs.transitions[0]).toMatchObject({
      status: "dispatched",
      mechanicId: MECHANIC_ID,
    });
  });

  test("keeps a rescue open when nobody is free", async () => {
    rescueWorkflowRepoMocks.listRescueRefsByStatus.mockImplementationOnce(
      async () => ({ rows: [ref(REQUEST_ID, "open")], pageState: null }),
    );
    rescueStubs.rowById = makeRescueRow({ status: "open" });

    const assigned = await redispatchOpenRescues();

    expect(assigned).toBe(0);
    expect(rescueStubs.transitions).toHaveLength(0);
  });
});
