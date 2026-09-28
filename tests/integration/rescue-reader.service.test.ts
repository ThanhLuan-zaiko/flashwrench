import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import { MECHANIC_ID } from "../helpers/mechanic.fixtures";
import {
  makeRescueRow,
  rescueConfigMocks,
  rescueStubs,
  rescueWorkflowRepoMocks,
  resetRescueMocks,
} from "../helpers/rescue.mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports. Reader lists hydrate refs through the row
// lookup and filter by live status.
mock.module(
  "@/lib/rescue/rescue-workflow.repository",
  () => rescueWorkflowRepoMocks,
);
mock.module("@/lib/rescue/rescue-config.service", () => rescueConfigMocks);

import {
  getPublicRescueTracking,
  getRescueDetail,
  listCustomerRescues,
  listDispatchRescues,
  listMechanicRescues,
} from "@/lib/rescue/rescue-reader.service";

const REQUEST_ID = "11111111-1111-1111-1111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";

function dispatcher() {
  return makePublicUser({ role: "dispatcher" });
}

function mechanic() {
  return makePublicUser({ id: MECHANIC_ID, role: "mechanic" });
}

function customer() {
  return makePublicUser({ id: CUSTOMER_ID, role: "customer" });
}

beforeEach(() => {
  resetRescueMocks();
});

describe("listDispatchRescues", () => {
  test("returns hydrated open rescues with a cursor", async () => {
    rescueWorkflowRepoMocks.listRescueRefsByStatus.mockImplementationOnce(
      async () => ({
        rows: [
          { status: "open", created_at: new Date(), request_id: REQUEST_ID },
        ],
        pageState: null,
      }),
    );
    rescueStubs.rowById = makeRescueRow({ status: "open" });

    const result = await listDispatchRescues(dispatcher(), { status: "open" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0]?.requestId).toBe(REQUEST_ID);
  });

  test("rejects unknown statuses and foreign cursors", async () => {
    const badStatus = await listDispatchRescues(dispatcher(), {
      status: "flying",
    });
    expect(badStatus.ok).toBe(false);

    const badCursor = await listDispatchRescues(dispatcher(), {
      status: "open",
      cursor: "not-a-cursor",
    });
    expect(badCursor.ok).toBe(false);
  });

  test("forbids non-staff readers", async () => {
    const customer = makePublicUser({ role: "customer" });
    const result = await listDispatchRescues(customer, { status: "open" });
    expect(result.ok).toBe(false);
  });

  test("journey statuses are boardable tabs", async () => {
    for (const status of ["en_route", "arrived"] as const) {
      const result = await listDispatchRescues(dispatcher(), { status });
      expect(result.ok).toBe(true);
    }
  });
});

describe("listMechanicRescues", () => {
  test("returns only my live offers", async () => {
    rescueWorkflowRepoMocks.listRescueRefsByMechanic.mockImplementationOnce(
      async () => [
        {
          status: "dispatched",
          created_at: new Date(),
          request_id: REQUEST_ID,
        },
      ],
    );
    rescueStubs.rowById = makeRescueRow({
      status: "dispatched",
      assigned_mechanic_id: MECHANIC_ID,
    });

    const result = await listMechanicRescues(mechanic());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(1);
  });

  test("hides offers assigned to someone else", async () => {
    rescueWorkflowRepoMocks.listRescueRefsByMechanic.mockImplementationOnce(
      async () => [
        {
          status: "dispatched",
          created_at: new Date(),
          request_id: REQUEST_ID,
        },
      ],
    );
    rescueStubs.rowById = makeRescueRow({
      status: "dispatched",
      assigned_mechanic_id: "99999999-9999-4999-8999-999999999999",
    });

    const result = await listMechanicRescues(mechanic());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(0);
  });

  test("keeps the live trip visible until completion", async () => {
    rescueWorkflowRepoMocks.listRescueRefsByMechanic.mockImplementationOnce(
      async () => [
        {
          status: "en_route",
          created_at: new Date(),
          request_id: REQUEST_ID,
        },
      ],
    );
    rescueStubs.rowById = makeRescueRow({
      status: "en_route",
      assigned_mechanic_id: MECHANIC_ID,
      eta_min: 7,
    });

    const result = await listMechanicRescues(mechanic());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0]?.etaMin).toBe(7);
  });

  test("drops closed rescues but keeps unpaid ones collectable", async () => {
    // A completed-and-paid rescue leaves the inbox; a completed-but-unpaid
    // rescue stays so the mechanic can collect the outstanding amount.
    rescueWorkflowRepoMocks.listRescueRefsByMechanic.mockImplementationOnce(
      async () => [
        {
          status: "completed",
          created_at: new Date(),
          request_id: REQUEST_ID,
        },
      ],
    );
    rescueStubs.rowById = makeRescueRow({
      status: "completed",
      payment_status: "paid",
      assigned_mechanic_id: MECHANIC_ID,
    });

    const paid = await listMechanicRescues(mechanic());
    expect(paid.ok).toBe(true);
    if (!paid.ok) return;
    expect(paid.data.items).toHaveLength(0);

    rescueWorkflowRepoMocks.listRescueRefsByMechanic.mockImplementationOnce(
      async () => [
        {
          status: "completed",
          created_at: new Date(),
          request_id: REQUEST_ID,
        },
      ],
    );
    rescueStubs.rowById = makeRescueRow({
      status: "completed",
      payment_status: "unpaid",
      assigned_mechanic_id: MECHANIC_ID,
    });

    const unpaid = await listMechanicRescues(mechanic());
    expect(unpaid.ok).toBe(true);
    if (!unpaid.ok) return;
    expect(unpaid.data.items).toHaveLength(1);
  });
});

describe("listCustomerRescues", () => {
  test("returns the customer's own rescues hydrated live", async () => {
    rescueWorkflowRepoMocks.listRescueRefsByCustomer.mockImplementationOnce(
      async () => [
        { status: "open", created_at: new Date(), request_id: REQUEST_ID },
      ],
    );
    rescueStubs.rowById = makeRescueRow({
      status: "dispatched",
      customer_id: CUSTOMER_ID,
    });

    const result = await listCustomerRescues(customer());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0]?.status).toBe("dispatched");
  });

  test("drops refs that no longer belong to the caller", async () => {
    rescueWorkflowRepoMocks.listRescueRefsByCustomer.mockImplementationOnce(
      async () => [
        { status: "open", created_at: new Date(), request_id: REQUEST_ID },
      ],
    );
    rescueStubs.rowById = makeRescueRow({
      customer_id: "99999999-9999-4999-8999-999999999999",
    });

    const result = await listCustomerRescues(customer());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(0);
  });

  test("forbids non-customer readers", async () => {
    const result = await listCustomerRescues(mechanic());
    expect(result.ok).toBe(false);
  });
});

describe("getRescueDetail", () => {
  test("mechanics cannot open another mechanic offer", async () => {
    rescueStubs.rowById = makeRescueRow({
      status: "dispatched",
      assigned_mechanic_id: "99999999-9999-4999-8999-999999999999",
    });

    const result = await getRescueDetail(mechanic(), REQUEST_ID);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(403);
  });

  test("customers can open the request they filed", async () => {
    rescueStubs.rowById = makeRescueRow({ customer_id: CUSTOMER_ID });

    const result = await getRescueDetail(customer(), REQUEST_ID);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.rescue.requestId).toBe(REQUEST_ID);
  });

  test("customers cannot open another customer's request", async () => {
    rescueStubs.rowById = makeRescueRow({
      customer_id: "99999999-9999-4999-8999-999999999999",
    });

    const result = await getRescueDetail(customer(), REQUEST_ID);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(403);
  });

  test("guest-filed requests stay staff-only", async () => {
    rescueStubs.rowById = makeRescueRow({ customer_id: null });

    const result = await getRescueDetail(customer(), REQUEST_ID);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(403);
  });
});

describe("getPublicRescueTracking", () => {
  test("returns journey progress without customer PII", async () => {
    rescueStubs.rowById = makeRescueRow({
      status: "en_route",
      eta_min: 9,
      assigned_mechanic_name: "Nguyen Van A",
    });

    const result = await getPublicRescueTracking(REQUEST_ID);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      requestId: REQUEST_ID,
      status: "en_route",
      etaMin: 9,
      mechanicName: "Nguyen Van A",
    });
    expect(result.data).not.toHaveProperty("customerPhone");
    expect(result.data).not.toHaveProperty("customerName");
  });

  test("rejects bad ids and missing requests", async () => {
    const badId = await getPublicRescueTracking("not-a-uuid");
    expect(badId.ok).toBe(false);
    if (badId.ok) return;
    expect(badId.status).toBe(400);

    rescueStubs.rowById = null;
    const missing = await getPublicRescueTracking(REQUEST_ID);
    expect(missing.ok).toBe(false);
    if (missing.ok) return;
    expect(missing.status).toBe(404);
  });
});
