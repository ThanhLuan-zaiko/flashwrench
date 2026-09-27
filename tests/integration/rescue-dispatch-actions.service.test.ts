import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser, makeUserRow } from "../helpers/auth.fixtures";
import { MECHANIC_ID, makeProfileRow } from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
} from "../helpers/mechanic.mocks";
import {
  makeRescueRow,
  rescueDispatchMocks,
  rescueStubs,
  rescueWorkflowRepoMocks,
  resetRescueMocks,
} from "../helpers/rescue.mocks";
import {
  resetServiceMocks,
  serviceStubs,
  userRepoMocks,
} from "../helpers/service-mocks";
import {
  domainPublishMocks,
  resetWorkspaceMocks,
} from "../helpers/workspace.mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports. Dispatcher override assigns, cancels or
// force-expires with an optimistic version check.
mock.module(
  "@/lib/rescue/rescue-workflow.repository",
  () => rescueWorkflowRepoMocks,
);
mock.module("@/lib/rescue/rescue-dispatch.service", () => rescueDispatchMocks);
mock.module(
  "@/lib/mechanic/mechanic-workspace.repository",
  () => mechanicWorkspaceRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);

import { applyDispatchRescueAction } from "@/lib/rescue/rescue-dispatch-actions.service";

const REQUEST_ID = "11111111-1111-1111-1111-111111111111";
const UPDATED = new Date("2026-01-01T00:00:00.000Z");

function dispatcher() {
  return makePublicUser({ role: "dispatcher" });
}

function versionBody(extra: Record<string, unknown> = {}) {
  return { expectedUpdatedAt: UPDATED.toISOString(), ...extra };
}

beforeEach(() => {
  resetRescueMocks();
  resetServiceMocks();
  resetWorkspaceMocks();
  serviceStubs.userById = makeUserRow({ role: "mechanic", status: "active" });
});

describe("applyDispatchRescueAction", () => {
  test("assign hands an open rescue to an eligible mechanic", async () => {
    rescueStubs.rowById = makeRescueRow({
      status: "open",
      updated_at: UPDATED,
    });
    mechanicStubs.profile = makeProfileRow();

    const result = await applyDispatchRescueAction(
      dispatcher(),
      REQUEST_ID,
      versionBody({ action: "assign", mechanicId: MECHANIC_ID }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      status: "dispatched",
      assignedMechanicId: MECHANIC_ID,
    });
    expect(rescueStubs.transitions[0]).toMatchObject({
      status: "dispatched",
      mechanicId: MECHANIC_ID,
    });
  });

  test("assign rejects an ineligible mechanic without writing", async () => {
    rescueStubs.rowById = makeRescueRow({
      status: "open",
      updated_at: UPDATED,
    });
    serviceStubs.userById = null;

    const result = await applyDispatchRescueAction(
      dispatcher(),
      REQUEST_ID,
      versionBody({ action: "assign", mechanicId: MECHANIC_ID }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(rescueStubs.transitions).toHaveLength(0);
  });

  test("cancel needs a note and moves to cancelled", async () => {
    rescueStubs.rowById = makeRescueRow({
      status: "dispatched",
      assigned_mechanic_id: MECHANIC_ID,
      updated_at: UPDATED,
    });

    const missing = await applyDispatchRescueAction(
      dispatcher(),
      REQUEST_ID,
      versionBody({ action: "cancel" }),
    );
    expect(missing.ok).toBe(false);

    const done = await applyDispatchRescueAction(
      dispatcher(),
      REQUEST_ID,
      versionBody({ action: "cancel", note: "Khach tu xu ly" }),
    );
    expect(done.ok).toBe(true);
    if (!done.ok) return;
    expect(done.data.status).toBe("cancelled");
    expect(rescueStubs.transitions[0]).toMatchObject({
      status: "cancelled",
      mechanicId: null,
    });
  });

  test("expire-now re-offers a stuck dispatched rescue", async () => {
    rescueStubs.rowReadQueue = [
      makeRescueRow({
        status: "dispatched",
        assigned_mechanic_id: MECHANIC_ID,
        updated_at: UPDATED,
      }),
      makeRescueRow({ status: "open", updated_at: new Date() }),
    ];

    const result = await applyDispatchRescueAction(
      dispatcher(),
      REQUEST_ID,
      versionBody({ action: "expire-now" }),
    );

    expect(result.ok).toBe(true);
    expect(rescueDispatchMocks.expireRescueOffer.mock.calls.length).toBe(1);
  });

  test("rejects stale versions without touching storage", async () => {
    rescueStubs.rowById = makeRescueRow({
      status: "open",
      updated_at: UPDATED,
    });

    const result = await applyDispatchRescueAction(dispatcher(), REQUEST_ID, {
      action: "assign",
      mechanicId: MECHANIC_ID,
      expectedUpdatedAt: new Date("2025-01-01T00:00:00Z").toISOString(),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(rescueStubs.transitions).toHaveLength(0);
  });

  test("forbids customers and unknown actions", async () => {
    const customer = makePublicUser({ role: "customer" });
    const forbidden = await applyDispatchRescueAction(
      customer,
      REQUEST_ID,
      versionBody({ action: "cancel", note: "x" }),
    );
    expect(forbidden.ok).toBe(false);

    rescueStubs.rowById = makeRescueRow({
      status: "open",
      updated_at: UPDATED,
    });
    const unknown = await applyDispatchRescueAction(
      dispatcher(),
      REQUEST_ID,
      versionBody({ action: "flying" }),
    );
    expect(unknown.ok).toBe(false);
    expect(rescueStubs.transitions).toHaveLength(0);
  });
});
