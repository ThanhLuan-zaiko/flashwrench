import { describe, expect, test } from "bun:test";
import {
  TILE_ATTRIBUTION,
  TILE_SUBDOMAINS,
  tileUrlForTheme,
} from "@/components/map/map-tiles";

// Tile provider config: the maps must keep working on networks that
// block *.openstreetmap.org, so the URL template and subdomain set are
// pinned here instead of being re-typed per component.

const EXPECTED_URL = "https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png";

describe("tileUrlForTheme", () => {
  test("serves the OSM Germany endpoint in light mode", () => {
    expect(tileUrlForTheme(false)).toBe(EXPECTED_URL);
  });

  test("serves the same endpoint in dark mode (no dark variant)", () => {
    expect(tileUrlForTheme(true)).toBe(EXPECTED_URL);
  });

  test("keeps the Leaflet subdomain placeholder and rotation set", () => {
    expect(EXPECTED_URL).toContain("{s}");
    expect(TILE_SUBDOMAINS).toBe("abc");
  });
});

describe("TILE_ATTRIBUTION", () => {
  test("keeps the required OSM credit", () => {
    expect(TILE_ATTRIBUTION).toContain("openstreetmap.org/copyright");
  });
});
