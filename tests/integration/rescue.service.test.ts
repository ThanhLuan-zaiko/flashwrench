import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import { makeRescueInput } from "../helpers/rescue.fixtures";
import {
  rescueDispatchMocks,
  rescueRepoMocks,
  rescueStubs,
  resetRescueMocks,
  zoneServiceMocks,
} from "../helpers/rescue.mocks";
import {
  domainPublishMocks,
  resetWorkspaceMocks,
} from "../helpers/workspace.mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports. The rescue service validates guest input,
// writes one batch, publishes created, then best-effort auto-offers.
mock.module("@/lib/rescue/rescue.repository", () => rescueRepoMocks);
mock.module("@/lib/rescue/rescue-dispatch.service", () => rescueDispatchMocks);
mock.module("@/lib/zones/zone.service", () => zoneServiceMocks);
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);

import { createRescueRequest } from "@/lib/rescue/rescue.service";

beforeEach(() => {
  resetRescueMocks();
  resetWorkspaceMocks();
});

describe("createRescueRequest", () => {
  test("creates an open guest rescue without touching auth", async () => {
    const result = await createRescueRequest(null, makeRescueInput());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      status: "open",
      issueType: "flat_tire",
      priority: "normal",
      vehiclePlate: "51F-12345",
    });
    expect(rescueStubs.inserts).toHaveLength(1);
    expect(rescueStubs.inserts[0]).toMatchObject({
      customerId: null,
      customerName: "Nguyen Van An",
      customerPhone: "0912345678",
      status: "open",
      priority: "normal",
      issueType: "flat_tire",
    });
  });

  test("links the logged-in customer and escalates accidents", async () => {
    const customer = makePublicUser();
    const result = await createRescueRequest(
      { id: customer.id },
      makeRescueInput({ issueType: "accident" }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.priority).toBe("high");
    expect(rescueStubs.inserts[0]).toMatchObject({
      customerId: customer.id,
      priority: "high",
    });
  });

  test("rejects invalid input with 400 without touching storage", async () => {
    const result = await createRescueRequest(
      null,
      makeRescueInput({ address: "Q3", phone: "abc" }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.address).toContain("10 đến 300");
    expect((result.errors.phone ?? "").toLowerCase()).toContain(
      "số điện thoại",
    );
    expect(rescueStubs.inserts).toHaveLength(0);
    expect(rescueRepoMocks.insertRescueRequest.mock.calls.length).toBe(0);
  });

  test("rejects unknown issue types without writing", async () => {
    const result = await createRescueRequest(
      null,
      makeRescueInput({ issueType: "flying_car" }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(rescueStubs.inserts).toHaveLength(0);
  });

  test("returns dispatched assignment when auto-dispatch offers", async () => {
    const { rescueDispatchStubs } = await import("../helpers/rescue.mocks");
    rescueDispatchStubs.autoDispatch = {
      mechanicId: "77777777-7777-4777-8777-777777777777",
      mechanicName: "Nguyen Van A",
      offerExpiresAt: new Date(Date.now() + 30_000).toISOString(),
    };

    const result = await createRescueRequest(null, makeRescueInput());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.status).toBe("dispatched");
    expect(result.data.assignedMechanicId).toBe(
      "77777777-7777-4777-8777-777777777777",
    );
    expect(typeof result.data.offerExpiresAt).toBe("string");
  });

  test("stays open when auto-dispatch throws", async () => {
    rescueDispatchMocks.autoDispatchRescue.mockImplementationOnce(async () => {
      throw new Error("dispatch down");
    });

    const result = await createRescueRequest(null, makeRescueInput());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.status).toBe("open");
    expect(result.data.assignedMechanicId).toBeNull();
    expect(rescueStubs.inserts).toHaveLength(1);
  });
});
