import { describe, expect, test } from "bun:test";
import { matchesOrderSearch } from "@/lib/orders/orders-search";

const order = {
  id: "7f3c2a10-1111-4111-8111-aaaaaaaaaaaa",
  customerName: "Nguyễn Văn An",
  customerPhone: "0901234567",
  trackingCode: "GHN-998877",
  courierName: "Giao Hàng Nhanh",
};

describe("matchesOrderSearch", () => {
  test("matches the customer name without diacritics", () => {
    expect(matchesOrderSearch(order, "nguyen van")).toBe(true);
  });

  test("matches the phone number and tracking code", () => {
    expect(matchesOrderSearch(order, "0901")).toBe(true);
    expect(matchesOrderSearch(order, "ghn-99887")).toBe(true);
  });

  test("matches a partial order id", () => {
    expect(matchesOrderSearch(order, "7f3c2a10")).toBe(true);
  });

  test("rejects a query that no field contains", () => {
    expect(matchesOrderSearch(order, "trần")).toBe(false);
  });

  test("an empty query matches every order", () => {
    expect(matchesOrderSearch(order, "")).toBe(true);
  });
});
