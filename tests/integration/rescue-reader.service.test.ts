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
