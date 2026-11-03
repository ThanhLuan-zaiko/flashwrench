import { describe, expect, test } from "bun:test";
import { matchesSearch, normalizeSearchText } from "@/lib/search-text";

describe("normalizeSearchText", () => {
  test("lowercases and strips Vietnamese diacritics", () => {
    expect(normalizeSearchText("Điện Thoại")).toBe("dien thoai");
  });

  test("folds đ and Đ to d", () => {
    expect(normalizeSearchText("Đèn Đường")).toBe("den duong");
  });
});

describe("matchesSearch", () => {
  test("an empty or blank query matches every row", () => {
    expect(matchesSearch("", ["Lốp xe"])).toBe(true);
    expect(matchesSearch("   ", ["Lốp xe"])).toBe(true);
  });

  test("matches accent-insensitively across any field", () => {
    expect(matchesSearch("dien", ["Bóng đèn", "Điện áp"])).toBe(true);
    expect(matchesSearch("LOP", ["Lốp xe", null])).toBe(true);
  });

  test("requires every word of the query to appear, in any spacing", () => {
    const fields = ["Dầu nhớt Castrol", "SKU-001"];
    expect(matchesSearch("dau castrol", fields)).toBe(true);
    expect(matchesSearch("  dau   castrol ", fields)).toBe(true);
    expect(matchesSearch("dau bosch", fields)).toBe(false);
  });

  test("a word cannot match across two different fields", () => {
    expect(matchesSearch("xe lop", ["lop", "xe"])).toBe(true);
    expect(matchesSearch("lopxe", ["lop", "xe"])).toBe(false);
  });

  test("null and undefined fields are ignored", () => {
    expect(matchesSearch("abc", [null, undefined])).toBe(false);
    expect(matchesSearch("abc", [undefined, "xabcx"])).toBe(true);
  });
});
