import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  makeRescueRow,
  rescueConfigMocks,
  rescueStubs,
  rescueWorkflowRepoMocks,
  resetRescueMocks,
} from "../helpers/rescue.mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports. Search runs over hydrated rescue rows.
mock.module(
  "@/lib/rescue/rescue-workflow.repository",
  () => rescueWorkflowRepoMocks,
);
mock.module("@/lib/rescue/rescue-config.service", () => rescueConfigMocks);

import { listDispatchRescues } from "@/lib/rescue/rescue-reader.service";

const REQUEST_ID = "11111111-1111-1111-1111-111111111111";

function dispatcher() {
  return makePublicUser({ role: "dispatcher" });
}

function openRef() {
  return { status: "open", created_at: new Date(), request_id: REQUEST_ID };
}

beforeEach(() => {
  resetRescueMocks();
});

describe("listDispatchRescues search", () => {
  test("keeps only rescues whose customer or plate matches", async () => {
    rescueStubs.rowById = makeRescueRow({
      status: "open",
      customer_name: "Trần Thị Bình",
      vehicle_plate: "51F-123.45",
    });
    rescueWorkflowRepoMocks.listRescueRefsByStatus.mockImplementationOnce(
      async () => ({ rows: [openRef()], pageState: null }),
    );
    const hit = await listDispatchRescues(dispatcher(), {
      status: "open",
      search: "TRAN thi",
    });
    expect(hit.ok).toBe(true);
    if (!hit.ok) return;
    expect(hit.data.items).toHaveLength(1);

    rescueWorkflowRepoMocks.listRescueRefsByStatus.mockImplementationOnce(
      async () => ({ rows: [openRef()], pageState: null }),
    );
    const miss = await listDispatchRescues(dispatcher(), {
      status: "open",
      search: "lê văn",
    });
    expect(miss.ok).toBe(true);
    if (!miss.ok) return;
    expect(miss.data.items).toHaveLength(0);
  });

  test("rejects an oversized search query", async () => {
    const result = await listDispatchRescues(dispatcher(), {
      status: "open",
      search: "x".repeat(81),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
  });
});
