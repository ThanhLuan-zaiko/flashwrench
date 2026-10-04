import { describe, expect, test } from "bun:test";
import { buildBookingHref, getSafeNextPath } from "@/lib/auth/auth-redirect";
import {
  decodeBookingServiceIds,
  getBookingServiceSelection,
  parseBookingServiceParams,
  readBookingServiceParams,
  replaceBookingServiceParams,
} from "@/lib/booking/booking-service-selection";
import { makeServiceItem } from "../helpers/catalog.fixtures";

const FIRST_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SECOND_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const catalog = [
  makeServiceItem({ id: FIRST_ID, basePrice: 199000, durationMin: 60 }),
  makeServiceItem({ id: SECOND_ID, basePrice: 101000, durationMin: 30 }),
];

describe("booking selection navigation", () => {
  test("round-trips all selected services through a shareable link", () => {
    const href = buildBookingHref([FIRST_ID, SECOND_ID]);
    const params = new URL(href, "http://localhost").searchParams;
    expect(
      parseBookingServiceParams({
        serviceIds: params.get("serviceIds") ?? undefined,
      }),
    ).toEqual({
      serviceIds: [FIRST_ID, SECOND_ID],
      error: null,
    });
  });

  test("retains legacy links and an empty entry", () => {
    expect(parseBookingServiceParams({ serviceId: FIRST_ID })).toEqual({
      serviceIds: [FIRST_ID],
      error: null,
    });
    expect(parseBookingServiceParams({})).toEqual({
      serviceIds: [],
      error: null,
    });
  });

  test("accepts repeated bundle parameters and rejects malformed lists", () => {
    expect(
      parseBookingServiceParams({ serviceIds: [FIRST_ID, SECOND_ID] })
        .serviceIds,
    ).toEqual([FIRST_ID, SECOND_ID]);
    for (const params of [
      { serviceIds: "" },
      { serviceIds: `${FIRST_ID},invalid` },
      { serviceIds: `${FIRST_ID},${FIRST_ID}` },
      { serviceId: [FIRST_ID, SECOND_ID] },
      { serviceId: SECOND_ID, serviceIds: FIRST_ID },
    ]) {
      expect(parseBookingServiceParams(params).error).toBeTruthy();
    }
  });

  test("updating a bundle preserves review pagers and supports refresh", () => {
    const path = replaceBookingServiceParams(
      `/booking?serviceId=${FIRST_ID}&srv_page=2#details`,
      [FIRST_ID, SECOND_ID],
    );
    const url = new URL(path, "http://localhost");
    expect(url.searchParams.get("serviceId")).toBeNull();
    expect(url.searchParams.get("srv_page")).toBe("2");
    expect(url.hash).toBe("#details");
    expect(
      parseBookingServiceParams(readBookingServiceParams(url.searchParams))
        .serviceIds,
    ).toEqual([FIRST_ID, SECOND_ID]);
    expect(replaceBookingServiceParams(path, [])).toBe(
      "/booking?srv_page=2#details",
    );
    const single = new URL(
      replaceBookingServiceParams(path, [SECOND_ID]),
      "http://localhost",
    );
    expect(single.searchParams.get("serviceIds")).toBeNull();
    expect(single.searchParams.get("serviceId")).toBe(SECOND_ID);
  });

  test("the maximum bundle still fits the safe auth redirect limit", () => {
    const ids = Array.from(
      { length: 8 },
      (_, index) => `0000000${index}-bbbb-4bbb-8bbb-bbbbbbbbbbbb`,
    );
    const href = buildBookingHref(ids);
    expect(getSafeNextPath(href)).toBe(href);
    expect(href.length).toBeLessThan(512);
  });
});

describe("booking selection summaries", () => {
  test("sums every selected price and duration, independent of visible catalog tabs", () => {
    const selection = getBookingServiceSelection(
      [SECOND_ID, FIRST_ID],
      catalog,
    );
    expect(selection.services.map((service) => service.id)).toEqual([
      SECOND_ID,
      FIRST_ID,
    ]);
    expect(selection.subtotal).toBe(300000);
    expect(selection.durationMin).toBe(90);
    expect(selection.issue).toBeNull();
  });

  test("never silently drops unavailable services", () => {
    const selection = getBookingServiceSelection(
      [FIRST_ID, SECOND_ID],
      catalog.slice(0, 1),
    );
    expect(selection.unavailableIds).toEqual([SECOND_ID]);
    expect(selection.issue).toBeTruthy();
  });

  test("blocks mixed at-home and workshop-only bundles but keeps individual bookings", () => {
    const services = [
      catalog[0],
      makeServiceItem({ id: SECOND_ID, isHomeSupported: false }),
    ];
    expect(
      getBookingServiceSelection([FIRST_ID, SECOND_ID], services).issue,
    ).toBeTruthy();
    expect(getBookingServiceSelection([SECOND_ID], services).issue).toBeNull();
  });

  test("keeps legacy duration fallbacks consistent with the server", () => {
    const selection = getBookingServiceSelection(
      [FIRST_ID],
      [makeServiceItem({ durationMin: 0 })],
    );
    expect(selection.durationMin).toBe(60);
  });

  test("ignores inactive and deleted catalog entries", () => {
    for (const override of [{ isActive: false }, { isDeleted: true }]) {
      expect(
        getBookingServiceSelection([FIRST_ID], [makeServiceItem(override)])
          .issue,
      ).toBeTruthy();
    }
  });
});

describe("stored service selection decoding", () => {
  test("accepts only bounded unique service ids", () => {
    expect(
      decodeBookingServiceIds(JSON.stringify([FIRST_ID, SECOND_ID])),
    ).toEqual([FIRST_ID, SECOND_ID]);
    for (const raw of [
      "invalid",
      "{}",
      "null",
      '["invalid"]',
      JSON.stringify([FIRST_ID, FIRST_ID]),
    ]) {
      expect(decodeBookingServiceIds(raw)).toEqual([]);
    }
  });
});
