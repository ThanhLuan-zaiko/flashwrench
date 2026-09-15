import { describe, expect, test } from "bun:test";
import {
  normalizeSlug,
  slugifyName,
  validateCategoryInput,
  validateServiceInput,
} from "@/lib/catalog/catalog-validation";

describe("normalizeSlug", () => {
  test("trims and lowercases", () => {
    expect(normalizeSlug("  Bao-Duong ")).toBe("bao-duong");
  });
});

describe("slugifyName", () => {
  test("builds a slug from a plain name", () => {
    expect(slugifyName("Thay dau dong co")).toBe("thay-dau-dong-co");
  });

  test("collapses separators and caps length", () => {
    expect(slugifyName("Sua   chua  luu-dong!!")).toBe("sua-chua-luu-dong");
    expect(slugifyName("Sua__chua_luu-dong")).toBe("sua-chua-luu-dong");
    expect(slugifyName("a".repeat(200)).length).toBeLessThanOrEqual(80);
  });
});

describe("validateCategoryInput", () => {
  const valid = {
    name: "Bao duong tai nha",
    slug: "bao-duong-tai-nha",
    description: "Thay dau.",
    sortOrder: 1,
  };

  test("accepts a valid payload", () => {
    expect(validateCategoryInput(valid)).toBeNull();
  });

  test("rejects blank names and malformed slugs", () => {
    expect(validateCategoryInput({ ...valid, name: "  " })).toMatchObject({
      name: expect.any(String),
    });
    expect(validateCategoryInput({ ...valid, slug: "AB" })).toMatchObject({
      slug: expect.any(String),
    });
    expect(
      validateCategoryInput({ ...valid, slug: "Slug Co Dau Cach" }),
    ).toMatchObject({ slug: expect.any(String) });
  });

  test("rejects out-of-range sort orders", () => {
    expect(validateCategoryInput({ ...valid, sortOrder: -1 })).toMatchObject({
      sortOrder: expect.any(String),
    });
    expect(validateCategoryInput({ ...valid, sortOrder: 1.5 })).toMatchObject({
      sortOrder: expect.any(String),
    });
  });
});

describe("validateServiceInput", () => {
  const valid = {
    categoryId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    name: "Thay dau dong co",
    slug: "thay-dau-dong-co",
    basePrice: 199000,
    priceUnit: "per_job",
    durationMin: 60,
  };

  test("accepts a valid payload", () => {
    expect(validateServiceInput(valid)).toBeNull();
  });

  test("requires a category and a known price unit", () => {
    expect(validateServiceInput({ ...valid, categoryId: "" })).toMatchObject({
      categoryId: expect.any(String),
    });
    expect(
      validateServiceInput({ ...valid, priceUnit: "per_visit" }),
    ).toMatchObject({
      priceUnit: expect.any(String),
    });
  });

  test("rejects negative, fractional and oversized prices", () => {
    expect(validateServiceInput({ ...valid, basePrice: -1 })).toMatchObject({
      basePrice: expect.any(String),
    });
    expect(validateServiceInput({ ...valid, basePrice: 19.99 })).toMatchObject({
      basePrice: expect.any(String),
    });
    expect(
      validateServiceInput({ ...valid, basePrice: 2_000_000_000 }),
    ).toMatchObject({ basePrice: expect.any(String) });
  });

  test("rejects durations outside 5 to 2880 minutes", () => {
    expect(validateServiceInput({ ...valid, durationMin: 4 })).toMatchObject({
      durationMin: expect.any(String),
    });
    expect(validateServiceInput({ ...valid, durationMin: 3000 })).toMatchObject(
      {
        durationMin: expect.any(String),
      },
    );
  });
});
