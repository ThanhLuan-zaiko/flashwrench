import { describe, expect, test } from "bun:test";
import { matchesRescueSearch } from "@/lib/rescue/rescue-search";

const rescue = {
  requestId: "b2d4e6f8-2222-4222-8222-bbbbbbbbbbbb",
  customerName: "Trần Thị Bình",
  customerPhone: "0912345678",
  vehiclePlate: "51F-123.45",
  address: "12 Nguyễn Huệ, Quận 1",
};

describe("matchesRescueSearch", () => {
  test("matches the customer, phone, plate and address", () => {
    expect(matchesRescueSearch(rescue, "tran thi")).toBe(true);
    expect(matchesRescueSearch(rescue, "0912")).toBe(true);
    expect(matchesRescueSearch(rescue, "51f-123")).toBe(true);
    expect(matchesRescueSearch(rescue, "nguyen hue")).toBe(true);
  });

  test("rejects a query that no field contains", () => {
    expect(matchesRescueSearch(rescue, "lê văn")).toBe(false);
  });

  test("an empty query matches every rescue", () => {
    expect(matchesRescueSearch(rescue, "  ")).toBe(true);
  });
});
