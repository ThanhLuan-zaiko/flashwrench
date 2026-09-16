import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ACCESS_COOKIE } from "@/lib/auth/session";
import { SERVICE_CATALOG_TOPIC } from "@/lib/realtime/protocol";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  catalogRouteStubs,
  catalogServiceRouteMocks,
  serviceCategoryRouteMocks,
} from "../helpers/catalog-route.mocks";
import {
  authServiceMocks,
  nextHeadersMocks,
  realtimePublishMocks,
  resetRouteMocks,
  routeStubs,
  setMockCookies,
} from "../helpers/route-mocks";

// Every admin catalog mutation must fan out a refresh signal so the public
// /services landing updates in realtime; failures stay silent.
mock.module("@/lib/auth/auth.service", () => authServiceMocks);
mock.module("next/headers", () => nextHeadersMocks);
mock.module(
  "@/lib/catalog/service-categories.service",
  () => serviceCategoryRouteMocks,
);
mock.module("@/lib/catalog/services.service", () => catalogServiceRouteMocks);
mock.module("@/lib/realtime/publish", () => realtimePublishMocks);

import {
  DELETE as deleteCategory,
  PATCH as patchCategory,
} from "@/app/api/admin/service-categories/[categoryId]/route";
import { POST as postCategories } from "@/app/api/admin/service-categories/route";
import {
  DELETE as deleteService,
  PATCH as patchService,
} from "@/app/api/admin/services/[serviceId]/route";
import { POST as postService } from "@/app/api/admin/services/route";

const CATEGORY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SERVICE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const categoryParams = Promise.resolve({ categoryId: CATEGORY_ID });
const serviceParams = Promise.resolve({ serviceId: SERVICE_ID });

function adminContext(): void {
  routeStubs.meUser = makePublicUser({ id: "admin-1", role: "admin" });
  setMockCookies({ [ACCESS_COOKIE]: "admin-token" });
}

function jsonRequest(path: string, method: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function expectCatalogBroadcast(): void {
  expect(realtimePublishMocks.publishRealtimeEvent.mock.calls.length).toBe(1);
  const [topic, payload] = realtimePublishMocks.publishRealtimeEvent.mock
    .calls[0] as [string, Record<string, unknown>];
  expect(topic).toBe(SERVICE_CATALOG_TOPIC);
  expect(payload.kind).toBe("catalog-updated");
  expect(typeof payload.updatedAt).toBe("string");
}

beforeEach(() => {
  resetRouteMocks();
  setMockCookies({});
});

describe("admin category routes", () => {
  test("POST broadcasts after creating a category", async () => {
    adminContext();
    const res = await postCategories(
      jsonRequest("/api/admin/service-categories", "POST", {
        name: "Bao duong",
        slug: "bao-duong",
      }),
    );
    expect(res.status).toBe(201);
    expectCatalogBroadcast();
  });

  test("POST stays silent when the service rejects", async () => {
    adminContext();
    catalogRouteStubs.categoryResult = {
      ok: false,
      status: 409,
      errors: { slug: "Slug da ton tai." },
    };
    const res = await postCategories(
      jsonRequest("/api/admin/service-categories", "POST", {
        name: "Bao duong",
        slug: "bao-duong",
      }),
    );
    expect(res.status).toBe(409);
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls.length).toBe(0);
  });

  test("PATCH toggle-active broadcasts", async () => {
    adminContext();
    const res = await patchCategory(
      jsonRequest(`/api/admin/service-categories/${CATEGORY_ID}`, "PATCH", {
        action: "toggle-active",
        isActive: false,
      }),
      { params: categoryParams },
    );
    expect(res.status).toBe(200);
    expectCatalogBroadcast();
  });

  test("PATCH with an unknown action stays silent", async () => {
    adminContext();
    const res = await patchCategory(
      jsonRequest(`/api/admin/service-categories/${CATEGORY_ID}`, "PATCH", {
        action: "unknown",
      }),
      { params: categoryParams },
    );
    expect(res.status).toBe(400);
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls.length).toBe(0);
  });

  test("DELETE broadcasts after a hard delete", async () => {
    adminContext();
    const res = await deleteCategory(
      jsonRequest(`/api/admin/service-categories/${CATEGORY_ID}`, "DELETE", {
        confirm: "bao-duong-tai-nha",
      }),
      { params: categoryParams },
    );
    expect(res.status).toBe(200);
    expectCatalogBroadcast();
  });

  test("rejects non-admin callers without publishing", async () => {
    routeStubs.meUser = makePublicUser({ id: "cust-1", role: "customer" });
    setMockCookies({ [ACCESS_COOKIE]: "customer-token" });
    const res = await postCategories(
      jsonRequest("/api/admin/service-categories", "POST", {
        name: "Bao duong",
        slug: "bao-duong",
      }),
    );
    expect(res.status).toBe(403);
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls.length).toBe(0);
  });
});

describe("admin service routes", () => {
  test("POST broadcasts after creating a price row", async () => {
    adminContext();
    const res = await postService(
      jsonRequest("/api/admin/services", "POST", {
        categoryId: CATEGORY_ID,
        name: "Thay dau",
        slug: "thay-dau",
        basePrice: 199000,
        priceUnit: "per_job",
        durationMin: 60,
      }),
    );
    expect(res.status).toBe(201);
    expectCatalogBroadcast();
  });

  test("PATCH toggle-active broadcasts", async () => {
    adminContext();
    const res = await patchService(
      jsonRequest(`/api/admin/services/${SERVICE_ID}`, "PATCH", {
        action: "toggle-active",
        isActive: false,
      }),
      { params: serviceParams },
    );
    expect(res.status).toBe(200);
    expectCatalogBroadcast();
  });

  test("PATCH stays silent when the service rejects", async () => {
    adminContext();
    catalogRouteStubs.serviceResult = {
      ok: false,
      status: 404,
      errors: { form: "Khong tim thay muc gia." },
    };
    const res = await patchService(
      jsonRequest(`/api/admin/services/${SERVICE_ID}`, "PATCH", {
        action: "soft-delete",
      }),
      { params: serviceParams },
    );
    expect(res.status).toBe(404);
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls.length).toBe(0);
  });

  test("DELETE broadcasts after a hard delete", async () => {
    adminContext();
    const res = await deleteService(
      jsonRequest(`/api/admin/services/${SERVICE_ID}`, "DELETE", {
        confirm: "thay-dau-dong-co",
      }),
      { params: serviceParams },
    );
    expect(res.status).toBe(200);
    expectCatalogBroadcast();
  });
});
