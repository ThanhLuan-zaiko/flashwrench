import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  catalogRouteStubs,
  okCategoryItem,
  okServiceItem,
  publicCatalogRouteMocks,
} from "../helpers/catalog-route.mocks";
import { resetRouteMocks } from "../helpers/route-mocks";

// The public catalog needs no login: guests browse active prices only.
mock.module(
  "@/lib/catalog/public-catalog.service",
  () => publicCatalogRouteMocks,
);

import { GET } from "@/app/api/services/route";

beforeEach(() => {
  resetRouteMocks();
});

describe("GET /api/services", () => {
  test("returns active categories and services without a session", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      categories: unknown[];
      services: unknown[];
    };
    expect(body.categories).toEqual([okCategoryItem()]);
    expect(body.services).toEqual([okServiceItem()]);
  });

  test("passes service errors through with their status", async () => {
    catalogRouteStubs.publicCatalogResult = {
      ok: false,
      status: 503,
      errors: { form: "Het han." },
    };
    const res = await GET();
    expect(res.status).toBe(503);
  });

  test("maps unexpected failures to a Vietnamese 500", async () => {
    catalogRouteStubs.publicCatalogThrows = true;
    const res = await GET();
    expect(res.status).toBe(500);
    const body = (await res.json()) as { errors: { form: string } };
    expect(body.errors.form).toMatch("Không tải được danh sách dịch vụ");
  });
});
