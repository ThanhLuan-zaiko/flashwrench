import { describe, expect, test } from "bun:test";
import {
  averageRatingOf,
  initialsOf,
  reviewTargetLabel,
  skillLabel,
} from "@/components/home/home-card-utils";

describe("skillLabel", () => {
  test("translates the schema skill keys to Vietnamese", () => {
    expect(skillLabel("engine")).toBe("Động cơ");
    expect(skillLabel("tire")).toBe("Lốp xe");
    expect(skillLabel("battery")).toBe("Ắc quy");
    expect(skillLabel("brake")).toBe("Phanh");
    expect(skillLabel("ac")).toBe("Điều hòa");
    expect(skillLabel("electrical")).toBe("Hệ thống điện");
    expect(skillLabel("diagnostics")).toBe("Chẩn đoán");
  });

  test("is case-insensitive and trims whitespace", () => {
    expect(skillLabel(" Engine ")).toBe("Động cơ");
  });

  test("passes unknown skills through trimmed", () => {
    expect(skillLabel("  sơn dặm ")).toBe("sơn dặm");
  });
});

describe("initialsOf", () => {
  test("takes the first letters of the first and last word", () => {
    expect(initialsOf("Nguyễn Văn An")).toBe("NA");
    expect(initialsOf("  Trần  Hùng  ")).toBe("TH");
  });

  test("takes two letters for single-word names", () => {
    expect(initialsOf("Hùng")).toBe("HÙ");
  });

  test("falls back for empty names", () => {
    expect(initialsOf("   ")).toBe("FW");
    expect(initialsOf("")).toBe("FW");
  });
});

describe("averageRatingOf", () => {
  test("returns zero for empty or fully unrated input", () => {
    expect(averageRatingOf([])).toBe(0);
    expect(averageRatingOf([0, 0])).toBe(0);
  });

  test("ignores unrated entries and rounds to one decimal", () => {
    expect(averageRatingOf([4.85, 0, 4.95])).toBe(4.9);
    expect(averageRatingOf([5, 4])).toBe(4.5);
  });
});

describe("reviewTargetLabel", () => {
  test("labels each review target kind in Vietnamese", () => {
    expect(reviewTargetLabel("mechanic", "Nguyễn Văn An")).toBe(
      "Đánh giá thợ Nguyễn Văn An",
    );
    expect(reviewTargetLabel("service", "Thay nhớt tận nơi")).toBe(
      "Đánh giá dịch vụ Thay nhớt tận nơi",
    );
    expect(reviewTargetLabel("part", "Má phanh")).toBe(
      "Đánh giá phụ tùng Má phanh",
    );
    expect(reviewTargetLabel("order", "#a1b2c3d4")).toBe(
      "Đánh giá đơn hàng #a1b2c3d4",
    );
  });
});
