import { describe, expect, test } from "bun:test";
import {
  filterCategoryOptions,
  filterSelectOptions,
  normalizeVi,
} from "@/app/admin/components/services/category-filter";

const OPTIONS = [
  { id: "home", name: "Bảo dưỡng tại nhà" },
  { id: "shop", name: "Bảo dưỡng tại cơ sở" },
  { id: "rescue", name: "Cứu hộ khẩn cấp" },
];

const SELECT_OPTIONS = [
  { value: "per_job", label: "Trọn gói" },
  { value: "per_hour", label: "Theo giờ" },
  { value: "per_item", label: "Theo món" },
];

describe("normalizeVi", () => {
  test("strips diacritics and lowercases", () => {
    expect(normalizeVi("Bảo Dưỡng")).toBe("bao duong");
    expect(normalizeVi("Cứu Hộ")).toBe("cuu ho");
  });

  test("maps d-stroke to plain d", () => {
    expect(normalizeVi("Đang áp dụng")).toBe("dang ap dung");
  });
});

describe("filterCategoryOptions", () => {
  test("returns every option for empty keywords", () => {
    expect(filterCategoryOptions(OPTIONS, "")).toEqual(OPTIONS);
    expect(filterCategoryOptions(OPTIONS, "   ")).toEqual(OPTIONS);
  });

  test("matches without diacritics", () => {
    expect(
      filterCategoryOptions(OPTIONS, "bao duong").map((o) => o.id),
    ).toEqual(["home", "shop"]);
    expect(filterCategoryOptions(OPTIONS, "co so").map((o) => o.id)).toEqual([
      "shop",
    ]);
  });

  test("ignores case and surrounding spaces", () => {
    expect(
      filterCategoryOptions(OPTIONS, "  CUU HO  ").map((o) => o.id),
    ).toEqual(["rescue"]);
  });

  test("returns empty when nothing matches", () => {
    expect(filterCategoryOptions(OPTIONS, "thay lop")).toEqual([]);
  });

  test("keeps the input array untouched", () => {
    const snapshot = [...OPTIONS];
    filterCategoryOptions(OPTIONS, "bao");
    expect(OPTIONS).toEqual(snapshot);
  });
});

describe("filterSelectOptions", () => {
  test("returns every option for empty keywords", () => {
    expect(filterSelectOptions(SELECT_OPTIONS, "")).toEqual(SELECT_OPTIONS);
  });

  test("matches labels without diacritics", () => {
    expect(
      filterSelectOptions(SELECT_OPTIONS, "theo").map((o) => o.value),
    ).toEqual(["per_hour", "per_item"]);
    expect(filterSelectOptions(SELECT_OPTIONS, "TRON GOI")).toEqual([
      SELECT_OPTIONS[0],
    ]);
  });

  test("returns empty when nothing matches", () => {
    expect(filterSelectOptions(SELECT_OPTIONS, "bao duong")).toEqual([]);
  });
});
