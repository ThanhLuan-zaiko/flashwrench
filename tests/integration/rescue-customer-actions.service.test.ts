import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import { MECHANIC_ID } from "../helpers/mechanic.fixtures";
import {
  makeRescueRow,
  rescueStubs,
  rescueWorkflowRepoMocks,
  resetRescueMocks,
} from "../helpers/rescue.mocks";
import {
  domainPublishMocks,
  resetWorkspaceMocks,
} from "../helpers/workspace.mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports. Customers may pull their own rescue back
// while no mechanic has departed; the 30s offer cycle keeps the row
// moving, so a lost CAS claim gets one bounded retry on a fresh read.
mock.module(
  "@/lib/rescue/rescue-workflow.repository",
  () => rescueWorkflowRepoMocks,
);
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);

import { cancelCustomerRescue } from "@/lib/rescue/rescue-customer-actions.service";

const REQUEST_ID = "11111111-1111-1111-1111-111111111111";
const CUSTOMER = makePublicUser({
  id: "aaaaaaaa-1111-4111-8111-111111111111",
  role: "customer",
});

function ownedRow(status: string) {
  return makeRescueRow({ status, customer_id: CUSTOMER.id });
}

beforeEach(() => {
  resetRescueMocks();
  resetWorkspaceMocks();
});

describe("cancelCustomerRescue", () => {
  test("cancels the customer's own open request", async () => {
    rescueStubs.rowById = ownedRow("open");

    const result = await cancelCustomerRescue(
      CUSTOMER,
      REQUEST_ID,
      "Xe nổ lại được rồi",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      requestId: REQUEST_ID,
      status: "cancelled",
    });
    expect(rescueStubs.transitions[0]).toMatchObject({
      status: "cancelled",
      mechanicId: null,
      actorId: CUSTOMER.id,
      note: "Xe nổ lại được rồi",
    });
    expect(domainPublishMocks.publishRescueChange.mock.calls[0]).toContain(
      "rescue-updated",
    );
  });

  test("cancels a dispatched/accepted request and releases the mechanic", async () => {
    for (const status of ["dispatched", "accepted"]) {
      resetRescueMocks();
      resetWorkspaceMocks();
      rescueStubs.rowById = {
        ...ownedRow(status),
        assigned_mechanic_id: MECHANIC_ID,
        assigned_mechanic_name: "Nguyen Van A",
      };

      const result = await cancelCustomerRescue(
        CUSTOMER,
        REQUEST_ID,
        "Tìm được thợ gần",
      );

      expect(result.ok).toBe(true);
      expect(rescueStubs.transitions[0]).toMatchObject({
        status: "cancelled",
        mechanicId: null,
        mechanicName: null,
      });
      // The released mechanic hears about it over realtime immediately.
      expect(
        domainPublishMocks.publishRescueChange.mock.calls[0]?.[4],
      ).toContain(MECHANIC_ID);
    }
  });

  test("refuses once the mechanic has departed or the case is closed", async () => {
    for (const status of ["en_route", "arrived", "completed", "cancelled"]) {
      resetRescueMocks();
      rescueStubs.rowById = ownedRow(status);

      const result = await cancelCustomerRescue(CUSTOMER, REQUEST_ID, "Đổi ý");

      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result.status).toBe(400);
      expect(rescueStubs.transitions).toHaveLength(0);
    }
  });

  test("hides requests owned by someone else or filed by a guest", async () => {
    rescueStubs.rowById = makeRescueRow({
      status: "open",
      customer_id: "bbbbbbbb-2222-4222-8222-222222222222",
    });
    const foreign = await cancelCustomerRescue(CUSTOMER, REQUEST_ID, "Đổi ý");
    expect(foreign.ok).toBe(false);
    if (!foreign.ok) expect(foreign.status).toBe(404);

    rescueStubs.rowById = makeRescueRow({ status: "open" });
    const guest = await cancelCustomerRescue(CUSTOMER, REQUEST_ID, "Đổi ý");
    expect(guest.ok).toBe(false);
    if (!guest.ok) expect(guest.status).toBe(404);
    expect(rescueStubs.transitions).toHaveLength(0);
  });

  test("rejects non-customer roles and invalid ids before touching storage", async () => {
    const mechanic = await cancelCustomerRescue(
      makePublicUser({ id: MECHANIC_ID, role: "mechanic" }),
      REQUEST_ID,
      "Đổi ý",
    );
    expect(mechanic.ok).toBe(false);
    if (!mechanic.ok) expect(mechanic.status).toBe(403);

    const badId = await cancelCustomerRescue(CUSTOMER, "not-a-uuid", "Đổi ý");
    expect(badId.ok).toBe(false);
    if (!badId.ok) expect(badId.status).toBe(400);
    expect(rescueStubs.transitions).toHaveLength(0);
  });

  test("requires a reason and bounds it to 300 characters", async () => {
    rescueStubs.rowById = ownedRow("open");

    const empty = await cancelCustomerRescue(CUSTOMER, REQUEST_ID, "   ");
    expect(empty.ok).toBe(false);
    if (!empty.ok) {
      expect(empty.status).toBe(400);
      expect(empty.errors.note).toBeDefined();
    }

    const long = await cancelCustomerRescue(
      CUSTOMER,
      REQUEST_ID,
      "x".repeat(301),
    );
    expect(long.ok).toBe(false);
    if (!long.ok) expect(long.errors.note).toBeDefined();
    expect(rescueStubs.transitions).toHaveLength(0);
  });

  test("loses the race honestly when the mechanic departs mid-cancel", async () => {
    rescueStubs.claimResults = [false];
    rescueStubs.rowReadQueue = [ownedRow("dispatched"), ownedRow("en_route")];

    const result = await cancelCustomerRescue(CUSTOMER, REQUEST_ID, "Đổi ý");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.form).toContain("xuất phát");
    expect(rescueStubs.transitions).toHaveLength(1);
  });

  test("retries once when the row moved to a still-cancellable state", async () => {
    rescueStubs.claimResults = [false, true];
    rescueStubs.rowReadQueue = [ownedRow("dispatched"), ownedRow("accepted")];

    const result = await cancelCustomerRescue(CUSTOMER, REQUEST_ID, "Đổi ý");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.status).toBe("cancelled");
    expect(rescueStubs.transitions).toHaveLength(2);
    expect(rescueStubs.transitions[1]?.before.status).toBe("accepted");
  });

  test("returns 409 when the row keeps moving past both attempts", async () => {
    rescueStubs.claimResults = [false, false];
    rescueStubs.rowReadQueue = [ownedRow("dispatched"), ownedRow("accepted")];

    const result = await cancelCustomerRescue(CUSTOMER, REQUEST_ID, "Đổi ý");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(rescueStubs.transitions).toHaveLength(2);
  });
});
