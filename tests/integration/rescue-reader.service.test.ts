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
  listDispatchRescues,
  listMechanicRescues,
} from "@/lib/rescue/rescue-reader.service";

const REQUEST_ID = "11111111-1111-1111-1111-111111111111";

function dispatcher() {
  return makePublicUser({ role: "dispatcher" });
}

function mechanic() {
  return makePublicUser({ id: MECHANIC_ID, role: "mechanic" });
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
});
