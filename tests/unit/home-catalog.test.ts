import { describe, expect, test } from "bun:test";
import {
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
