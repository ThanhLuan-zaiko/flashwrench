import { describe, expect, test } from "bun:test";
import { countServicesByCategory } from "@/lib/catalog/catalog-counts";
import {
  HOME_CATEGORY_LIMIT,
  pickHomeCategories,
} from "@/lib/home/home-catalog.service";
import { makeCategoryItem, makeServiceItem } from "../helpers/catalog.fixtures";

describe("countServicesByCategory", () => {
  test("counts services per category id", () => {
    const counts = countServicesByCategory([
      { categoryId: "a" },
      { categoryId: "b" },
      { categoryId: "a" },
    ]);
    expect(counts.get("a")).toBe(2);
    expect(counts.get("b")).toBe(1);
    expect(counts.get("c")).toBeUndefined();
  });

  test("returns an empty map for an empty list", () => {
    expect(countServicesByCategory([]).size).toBe(0);
  });
});

describe("pickHomeCategories", () => {
  test("keeps only live categories that hold a bookable service", () => {
    const picked = pickHomeCategories(
      [
        makeCategoryItem({ id: "live" }),
        makeCategoryItem({ id: "off", isActive: false }),
        makeCategoryItem({ id: "gone", isDeleted: true }),
        makeCategoryItem({ id: "empty" }),
      ],
      [
        makeServiceItem({ id: "s1", categoryId: "live" }),
        makeServiceItem({ id: "s2", categoryId: "off" }),
        makeServiceItem({ id: "s3", categoryId: "gone" }),
      ],
    );
    expect(picked.map((category) => category.id)).toEqual(["live"]);
  });

  test("replaces serviceCount with the live count", () => {
    const [picked] = pickHomeCategories(
      [makeCategoryItem({ id: "c", serviceCount: 9 })],
      [
        makeServiceItem({ id: "s1", categoryId: "c" }),
        makeServiceItem({ id: "s2", categoryId: "c" }),
        makeServiceItem({ id: "s3", categoryId: "c", isActive: false }),
        makeServiceItem({ id: "s4", categoryId: "c", isDeleted: true }),
      ],
    );
    expect(picked?.serviceCount).toBe(2);
  });

  test("orders by sort order, then by Vietnamese name", () => {
    const picked = pickHomeCategories(
      [
        makeCategoryItem({ id: "late", sortOrder: 3, name: "A" }),
        makeCategoryItem({ id: "second", sortOrder: 1, name: "Sửa" }),
        makeCategoryItem({ id: "first", sortOrder: 1, name: "Bảo dưỡng" }),
      ],
      ["late", "second", "first"].map((id) =>
        makeServiceItem({ id: `s-${id}`, categoryId: id }),
      ),
    );
    expect(picked.map((category) => category.id)).toEqual([
      "first",
      "second",
      "late",
    ]);
  });

  test("caps the chapter at the limit", () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g"];
    const categories = ids.map((id) => makeCategoryItem({ id }));
    const services = ids.map((id) =>
      makeServiceItem({ id: `s-${id}`, categoryId: id }),
    );
    expect(HOME_CATEGORY_LIMIT).toBe(6);
    expect(pickHomeCategories(categories, services)).toHaveLength(6);
    expect(pickHomeCategories(categories, services, 2)).toHaveLength(2);
    expect(pickHomeCategories(categories, services, 0)).toHaveLength(0);
  });
});
