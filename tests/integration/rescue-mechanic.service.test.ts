import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  MECHANIC_ID,
  MECHANIC_OTHER_ID,
  makeLocationRow,
  makeProfileRow,
} from "../helpers/mechanic.fixtures";
import {
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import {
  makeRescueRow,
  rescueDispatchMocks,
  rescueStubs,
  rescueWorkflowRepoMocks,
  resetRescueMocks,
} from "../helpers/rescue.mocks";
import {
  domainPublishMocks,
  resetWorkspaceMocks,
} from "../helpers/workspace.mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports. Mechanics only answer their own 30s offer;
// a decline triggers an immediate re-offer to the next mechanic.
mock.module(
  "@/lib/rescue/rescue-workflow.repository",
  () => rescueWorkflowRepoMocks,
);
mock.module("@/lib/rescue/rescue-dispatch.service", () => rescueDispatchMocks);
mock.module(
  "@/lib/mechanic/mechanic-workspace.repository",
  () => mechanicWorkspaceRepoMocks,
);
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);

import { applyRescueMechanicAction } from "@/lib/rescue/rescue-mechanic.service";

const REQUEST_ID = "11111111-1111-1111-1111-111111111111";

function assignedRow(status: string, etaMin: number | null = null) {
  return makeRescueRow({
    status,
    assigned_mechanic_id: MECHANIC_ID,
    assigned_mechanic_name: "Nguyen Van A",
    eta_min: etaMin,
  });
}

beforeEach(() => {
  resetRescueMocks();
  resetMechanicMocks();
  resetWorkspaceMocks();
});

describe("applyRescueMechanicAction", () => {
  test("accept moves a dispatched offer to accepted", async () => {
    rescueStubs.rowById = makeRescueRow({
      status: "dispatched",
      assigned_mechanic_id: MECHANIC_ID,
      assigned_mechanic_name: "Nguyen Van A",
    });

    const result = await applyRescueMechanicAction(
      MECHANIC_ID,
      REQUEST_ID,
      "accept",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      status: "accepted",
      assignedMechanicId: MECHANIC_ID,
    });
    expect(rescueStubs.transitions[0]).toMatchObject({
      status: "accepted",
      mechanicId: MECHANIC_ID,
    });
  });

  test("decline unassigns and re-offers the next mechanic", async () => {
    rescueStubs.rowById = makeRescueRow({
      status: "dispatched",
      assigned_mechanic_id: MECHANIC_ID,
    });

    const result = await applyRescueMechanicAction(
      MECHANIC_ID,
      REQUEST_ID,
      "decline",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.status).toBe("open");
    expect(rescueStubs.transitions[0]).toMatchObject({
      status: "open",
      mechanicId: null,
    });
    expect(rescueDispatchMocks.redispatchAfterDecline.mock.calls.length).toBe(
      1,
    );
  });

  test("rejects another mechanic and non-dispatched rows", async () => {
    rescueStubs.rowById = makeRescueRow({
      status: "dispatched",
      assigned_mechanic_id: MECHANIC_ID,
    });
    const foreign = await applyRescueMechanicAction(
      MECHANIC_OTHER_ID,
      REQUEST_ID,
      "accept",
    );
    expect(foreign.ok).toBe(false);
    if (foreign.ok) return;
    expect(foreign.status).toBe(403);

    rescueStubs.rowById = makeRescueRow({ status: "open" });
    const wrongState = await applyRescueMechanicAction(
      MECHANIC_ID,
      REQUEST_ID,
      "accept",
    );
    expect(wrongState.ok).toBe(false);
    expect(rescueStubs.transitions).toHaveLength(0);
  });

  test("rejects unknown actions without touching storage", async () => {
    rescueStubs.rowById = makeRescueRow({ status: "dispatched" });

    const result = await applyRescueMechanicAction(
      MECHANIC_ID,
      REQUEST_ID,
      "flying",
    );

    expect(result.ok).toBe(false);
    expect(rescueStubs.transitions).toHaveLength(0);
  });
});

describe("rescue journey actions", () => {
  test("depart moves accepted to en_route with an ETA from live GPS", async () => {
    rescueStubs.rowById = assignedRow("accepted");
    mechanicStubs.location = makeLocationRow();

    const result = await applyRescueMechanicAction(
      MECHANIC_ID,
      REQUEST_ID,
      "depart",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.status).toBe("en_route");
    expect(result.data.assignedMechanicId).toBe(MECHANIC_ID);
    expect(result.data.etaMin).toBeGreaterThan(0);
    expect(rescueStubs.transitions[0]).toMatchObject({
      status: "en_route",
      mechanicId: MECHANIC_ID,
    });
    expect(rescueStubs.transitions[0]?.etaMin).toBeGreaterThan(0);
    expect(domainPublishMocks.publishRescueChange.mock.calls[0]).toContain(
      "rescue-updated",
    );
  });

  test("depart falls back to the garage base without live GPS", async () => {
    rescueStubs.rowById = assignedRow("accepted");
    mechanicStubs.location = null;
    mechanicStubs.profile = makeProfileRow();

    const result = await applyRescueMechanicAction(
      MECHANIC_ID,
      REQUEST_ID,
      "depart",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.etaMin).toBeGreaterThan(0);
  });

  test("depart stores no ETA when the rescue has no coordinates", async () => {
    rescueStubs.rowById = assignedRow("accepted");
    rescueStubs.rowById.address_lat = null;
    rescueStubs.rowById.address_lng = null;

    const result = await applyRescueMechanicAction(
      MECHANIC_ID,
      REQUEST_ID,
      "depart",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.etaMin).toBeNull();
    expect(rescueStubs.transitions[0]?.etaMin).toBeNull();
  });

  test("arrive moves en_route to arrived and clears the ETA", async () => {
    rescueStubs.rowById = assignedRow("en_route", 12);

    const result = await applyRescueMechanicAction(
      MECHANIC_ID,
      REQUEST_ID,
      "arrive",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.status).toBe("arrived");
    expect(rescueStubs.transitions[0]).toMatchObject({
      status: "arrived",
      mechanicId: MECHANIC_ID,
      etaMin: null,
    });
  });

  test("complete closes the rescue from arrived or en_route", async () => {
    rescueStubs.rowById = assignedRow("arrived");
    const fromArrived = await applyRescueMechanicAction(
      MECHANIC_ID,
      REQUEST_ID,
      "complete",
    );
    expect(fromArrived.ok).toBe(true);
    if (fromArrived.ok) {
      expect(fromArrived.data.status).toBe("completed");
    }

    rescueStubs.rowById = assignedRow("en_route", 5);
    const fromEnRoute = await applyRescueMechanicAction(
      MECHANIC_ID,
      REQUEST_ID,
      "complete",
    );
    expect(fromEnRoute.ok).toBe(true);
    if (fromEnRoute.ok) {
      expect(fromEnRoute.data.status).toBe("completed");
    }
  });

  test("journey actions are rejected before accept and after close", async () => {
    rescueStubs.rowById = assignedRow("dispatched");
    const earlyDepart = await applyRescueMechanicAction(
      MECHANIC_ID,
      REQUEST_ID,
      "depart",
    );
    expect(earlyDepart.ok).toBe(false);
    if (earlyDepart.ok) return;
    expect(earlyDepart.status).toBe(400);

    rescueStubs.rowById = assignedRow("completed");
    const lateArrive = await applyRescueMechanicAction(
      MECHANIC_ID,
      REQUEST_ID,
      "arrive",
    );
    expect(lateArrive.ok).toBe(false);
    expect(rescueStubs.transitions).toHaveLength(0);
  });

  test("journey actions only apply to the assigned mechanic", async () => {
    rescueStubs.rowById = assignedRow("accepted");

    const result = await applyRescueMechanicAction(
      MECHANIC_OTHER_ID,
      REQUEST_ID,
      "depart",
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(403);
    expect(rescueStubs.transitions).toHaveLength(0);
  });
});
