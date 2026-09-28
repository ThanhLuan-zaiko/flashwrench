import { describe, expect, test } from "bun:test";
import { mapViewUrl } from "@/app/dispatch/components/bookings/dispatch-format";
import {
  googleDirectionsUrl,
  googleMapViewUrl,
} from "@/app/mechanic/components/navigation/navigation-directions";
import type { MechanicNavigationTarget } from "@/services/mechanic.api";

// Outbound map links: every URL the UI hands to the browser must stay on
// Google Maps, since *.openstreetmap.org is unreachable on some networks.

const TARGET = {
  kind: "booking",
  bookingId: "b1",
  customerName: "Khach",
  addressText: "123 Nguyen Trai",
  lat: 10.7721,
  lng: 106.6823,
  status: "en_route",
  scheduledAt: null,
  timezone: null,
  distanceKm: 1.2,
  etaMin: 5,
} as MechanicNavigationTarget;

describe("googleDirectionsUrl", () => {
  test("builds a driving directions link to the target", () => {
    const url = new URL(googleDirectionsUrl(null, TARGET));
    expect(url.origin + url.pathname).toBe("https://www.google.com/maps/dir/");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("destination")).toBe("10.7721,106.6823");
    expect(url.searchParams.get("travelmode")).toBe("driving");
    expect(url.searchParams.get("origin")).toBeNull();
  });

  test("includes the origin when the mechanic position is known", () => {
    const url = new URL(
      googleDirectionsUrl({ lat: 10.78, lng: 106.7 }, TARGET),
    );
    expect(url.searchParams.get("origin")).toBe("10.78,106.7");
    expect(url.searchParams.get("destination")).toBe("10.7721,106.6823");
  });
});

describe("googleMapViewUrl", () => {
  test("builds a map search link pinned at the point", () => {
    const url = new URL(googleMapViewUrl(10.7721, 106.6823));
    expect(url.origin + url.pathname).toBe(
      "https://www.google.com/maps/search/",
    );
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("query")).toBe("10.7721,106.6823");
  });
});

describe("mapViewUrl", () => {
  test("returns null when either coordinate is missing", () => {
    expect(mapViewUrl(null, 106.6823)).toBeNull();
    expect(mapViewUrl(10.7721, null)).toBeNull();
    expect(mapViewUrl(null, null)).toBeNull();
  });

  test("delegates to the Google Maps view link", () => {
    expect(mapViewUrl(10.7721, 106.6823)).toBe(
      googleMapViewUrl(10.7721, 106.6823),
    );
  });
});
