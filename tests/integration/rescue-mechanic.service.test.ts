import { beforeEach, describe, expect, mock, test } from "bun:test";
import { MECHANIC_ID, MECHANIC_OTHER_ID } from "../helpers/mechanic.fixtures";
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
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);

import { applyRescueMechanicAction } from "@/lib/rescue/rescue-mechanic.service";

const REQUEST_ID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  resetRescueMocks();
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
