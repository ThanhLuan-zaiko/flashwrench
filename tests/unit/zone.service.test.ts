import { describe, expect, test } from "bun:test";
import type { ServiceZoneRow } from "@/lib/zones/zone.repository";
import { selectZoneForPoint } from "@/lib/zones/zone.service";

function makeZone(overrides?: Partial<ServiceZoneRow>): ServiceZoneRow {
  return {
    zone_id: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
    name: "Quan 1 - HCMC",
    city: "TP Ho Chi Minh",
    center_lat: 10.775,
    center_lng: 106.7,
    radius_km: 5,
    is_active: true,
    ...overrides,
  };
}

// Pure zone selection: nearest active zone containing the point wins.
// Outside every radius the rescue stays zoneless and broadcasts.
describe("selectZoneForPoint", () => {
  test("picks the containing zone", () => {
    const zone = makeZone();
    expect(
      selectZoneForPoint([zone], { lat: 10.776, lng: 106.701 })?.zone_id,
    ).toBe(zone.zone_id);
  });

  test("returns null outside every radius", () => {
    expect(
      selectZoneForPoint([makeZone()], { lat: 21.0285, lng: 105.8542 }),
    ).toBeNull();
  });

  test("skips inactive and centerless zones", () => {
    const inactive = makeZone({ is_active: false });
    const noCenter = makeZone({ center_lat: null });
    expect(
      selectZoneForPoint([inactive, noCenter], { lat: 10.776, lng: 106.701 }),
    ).toBeNull();
  });

  test("prefers the nearest of overlapping zones", () => {
    const near = makeZone({ zone_id: "near" });
    const far = makeZone({
      zone_id: "far",
      center_lat: 10.79,
      center_lng: 106.71,
      radius_km: 10,
    });
    expect(
      selectZoneForPoint([far, near], { lat: 10.776, lng: 106.701 })?.zone_id,
    ).toBe("near");
  });
});
