import { describe, expect, test } from "bun:test";
import {
  AUTH_SERVICE_LIMIT,
  pickAuthServices,
  pickHomeProducts,
  pickHomeServices,
} from "@/lib/home/home-catalog.service";
import { makeServiceItem } from "../helpers/catalog.fixtures";
import { makePartItem } from "../helpers/home-catalog.fixtures";

describe("pickHomeServices", () => {
  test("drops inactive and deleted services", () => {
    const picked = pickHomeServices([
      makeServiceItem({ id: "a", isActive: false }),
      makeServiceItem({ id: "b", isDeleted: true }),
      makeServiceItem({ id: "c" }),
    ]);
    expect(picked.map((service) => service.id)).toEqual(["c"]);
  });

  test("ranks photographed services before photo-less ones", () => {
    const picked = pickHomeServices([
      makeServiceItem({ id: "plain", name: "Bảo dưỡng", imageUrl: "" }),
      makeServiceItem({ id: "photo", name: "Thay lốp", imageUrl: "/x.jpg" }),
    ]);
    expect(picked.map((service) => service.id)).toEqual(["photo", "plain"]);
  });

  test("caps the result at the limit", () => {
    const services = ["A", "B", "C"].map((name) =>
      makeServiceItem({ id: name, name }),
    );
    expect(pickHomeServices(services, 2)).toHaveLength(2);
    expect(pickHomeServices(services, 0)).toHaveLength(0);
  });
});

describe("pickAuthServices", () => {
  const dated = (id: string, createdAt: string | null, extra = {}) =>
    makeServiceItem({ id, createdAt, imageUrl: "/x.jpg", ...extra });

  test("keeps only the five newest photographed services", () => {
    const services = Array.from({ length: 8 }, (_, i) =>
      dated(`s${i}`, `2026-0${i + 1}-01T00:00:00Z`),
    );
    const picked = pickAuthServices(services);
    expect(AUTH_SERVICE_LIMIT).toBe(5);
    expect(picked.map((service) => service.id)).toEqual([
      "s7",
      "s6",
      "s5",
      "s4",
      "s3",
    ]);
  });

  test("skips photo-less, inactive and deleted services before capping", () => {
    const picked = pickAuthServices([
      dated("newest-no-photo", "2026-09-01T00:00:00Z", { imageUrl: "" }),
      dated("off", "2026-08-01T00:00:00Z", { isActive: false }),
      dated("gone", "2026-07-01T00:00:00Z", { isDeleted: true }),
      dated("ok", "2026-01-01T00:00:00Z"),
    ]);
    expect(picked.map((service) => service.id)).toEqual(["ok"]);
  });

  test("sorts a missing createdAt last", () => {
    const picked = pickAuthServices([
      dated("unknown", null),
      dated("known", "2026-01-01T00:00:00Z"),
    ]);
    expect(picked.map((service) => service.id)).toEqual(["known", "unknown"]);
  });
});

describe("pickHomeProducts", () => {
  test("hides out-of-stock, inactive and deleted parts", () => {
    const picked = pickHomeProducts([
      makePartItem({ id: "sold-out", stockQty: 0 }),
      makePartItem({ id: "off", isActive: false }),
      makePartItem({ id: "gone", isDeleted: true }),
      makePartItem({ id: "ok" }),
    ]);
    expect(picked.map((part) => part.id)).toEqual(["ok"]);
  });

  test("orders photographed parts first, then best sellers", () => {
    const picked = pickHomeProducts([
      makePartItem({ id: "few", soldCount: 1 }),
      makePartItem({ id: "many", soldCount: 50 }),
      makePartItem({ id: "no-photo", imageUrl: "", soldCount: 999 }),
    ]);
    expect(picked.map((part) => part.id)).toEqual(["many", "few", "no-photo"]);
  });

  test("caps the result at the limit", () => {
    const parts = [1, 2, 3].map((n) => makePartItem({ id: `p${n}` }));
    expect(pickHomeProducts(parts, 2)).toHaveLength(2);
  });
});
