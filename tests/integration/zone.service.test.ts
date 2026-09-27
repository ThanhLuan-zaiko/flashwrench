import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  makeZoneRow,
  resetZoneAdminMocks,
  zoneAdminStubs,
  zoneRepoMocks,
} from "../helpers/zone.mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports. Only admins mutate zones; validation
// rejects bad centers and radii without touching storage.
mock.module("@/lib/zones/zone.repository", () => zoneRepoMocks);

import { createZone, listZones, updateZone } from "@/lib/zones/zone.service";

function admin() {
  return makePublicUser({ role: "admin" });
}

beforeEach(() => {
  resetZoneAdminMocks();
});

describe("zone admin", () => {
  test("lists every zone for admins only", async () => {
    zoneAdminStubs.zones = [makeZoneRow()];

    const result = await listZones(admin());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(1);

    const customer = makePublicUser({ role: "customer" });
    const forbidden = await listZones(customer);
    expect(forbidden.ok).toBe(false);
  });

  test("creates a zone with normalized values", async () => {
    const result = await createZone(admin(), {
      name: "  Quan 1 - HCMC  ",
      city: "TP Ho Chi Minh",
      centerLat: 10.775,
      centerLng: 106.7,
      radiusKm: 5,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.item.name).toBe("Quan 1 - HCMC");
    expect(zoneAdminStubs.inserts).toHaveLength(1);
    expect(zoneAdminStubs.inserts[0]).toMatchObject({ radiusKm: 5 });
  });

  test("rejects bad centers and radii without writing", async () => {
    const badCenter = await createZone(admin(), {
      name: "Q1",
      centerLat: 91,
      centerLng: 106.7,
      radiusKm: 5,
    });
    expect(badCenter.ok).toBe(false);

    const badRadius = await createZone(admin(), {
      name: "Q1",
      centerLat: 10.775,
      centerLng: 106.7,
      radiusKm: 500,
    });
    expect(badRadius.ok).toBe(false);
    if (badRadius.ok) return;
    expect(badRadius.errors.radiusKm).toContain("0,5 đến 100");

    expect(zoneAdminStubs.inserts).toHaveLength(0);
  });

  test("updates and deactivates without deleting", async () => {
    zoneAdminStubs.zoneById = makeZoneRow();

    const result = await updateZone(admin(), zoneAdminStubs.zoneById.zone_id, {
      name: "Quan 1 - HCMC",
      city: "TP Ho Chi Minh",
      centerLat: 10.775,
      centerLng: 106.7,
      radiusKm: 8,
      isActive: false,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.item.isActive).toBe(false);
    expect(zoneAdminStubs.updates[0]).toMatchObject({
      radiusKm: 8,
      isActive: false,
    });
  });

  test("returns 404 for unknown zones", async () => {
    zoneAdminStubs.zoneById = null;

    const result = await updateZone(admin(), "nope", {
      name: "Q1",
      centerLat: 10.775,
      centerLng: 106.7,
      radiusKm: 5,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
    expect(zoneAdminStubs.updates).toHaveLength(0);
  });
});
