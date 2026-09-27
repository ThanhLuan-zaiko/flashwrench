// Return-request guards: 3-day window from the latest delivered history
// entry, plus payload validation (reason + evidence photos from /api/media).
import { describe, expect, test } from "bun:test";
import {
  canCustomerReturn,
  isReturnImageUrl,
  latestDeliveredAt,
  RETURN_IMAGE_MAX,
  RETURN_REASON_MAX,
  RETURN_WINDOW_MS,
  returnWindowOpen,
  validateReturnInput,
} from "@/lib/orders/order-return";

const NOW = new Date("2026-02-10T12:00:00.000Z");
const INSIDE = new Date(NOW.getTime() - RETURN_WINDOW_MS + 60_000);
const EXPIRED = new Date(NOW.getTime() - RETURN_WINDOW_MS - 60_000);

describe("latestDeliveredAt", () => {
  test("picks the newest delivered entry and ignores the rest", () => {
    const at = latestDeliveredAt([
      { newStatus: "pending", changedAt: new Date("2026-02-01") },
      { newStatus: "delivered", changedAt: new Date("2026-02-05") },
      { newStatus: "delivered", changedAt: new Date("2026-02-07") },
    ]);
    expect(at?.toISOString()).toBe("2026-02-07T00:00:00.000Z");
  });

  test("null when the order was never delivered", () => {
    expect(
      latestDeliveredAt([{ newStatus: "shipping", changedAt: NOW }]),
    ).toBeNull();
    expect(latestDeliveredAt([])).toBeNull();
  });
});

describe("returnWindowOpen", () => {
  test("open inside 3 days of delivery, closed after", () => {
    expect(returnWindowOpen(INSIDE, NOW)).toBe(true);
    expect(returnWindowOpen(EXPIRED, NOW)).toBe(false);
    expect(returnWindowOpen(null, NOW)).toBe(false);
  });
});

describe("canCustomerReturn", () => {
  const history = (at: Date | null) => [
    {
      newStatus: "delivered",
      changedAt: at ? at.toISOString() : null,
      oldStatus: "shipping",
      changedBy: "staff",
      note: "",
    },
  ];

  test("delivered + inside window is returnable", () => {
    expect(
      canCustomerReturn({ status: "delivered", history: history(INSIDE) }, NOW),
    ).toBe(true);
  });

  test("non-delivered statuses are never returnable", () => {
    for (const status of [
      "pending",
      "confirmed",
      "packing",
      "shipping",
      "return_requested",
      "cancelled",
      "refunded",
    ] as const) {
      expect(canCustomerReturn({ status, history: history(INSIDE) }, NOW)).toBe(
        false,
      );
    }
  });

  test("delivered past the window is not returnable", () => {
    expect(
      canCustomerReturn(
        { status: "delivered", history: history(EXPIRED) },
        NOW,
      ),
    ).toBe(false);
  });
});

describe("isReturnImageUrl", () => {
  test("only accepts the app's own media URLs", () => {
    expect(isReturnImageUrl("/api/media/return/2026-02/a.jpg")).toBe(true);
    expect(isReturnImageUrl("https://evil.example/x.jpg")).toBe(false);
    expect(isReturnImageUrl("/uploads/x.jpg")).toBe(false);
  });
});

describe("validateReturnInput", () => {
  const valid = {
    reason: "Bugi bi mo dau",
    images: ["/api/media/return/2026-02/a.jpg"],
  };

  test("accepts a well-formed request", () => {
    expect(validateReturnInput(valid)).toBeNull();
  });

  test("requires a non-empty reason under the length cap", () => {
    expect(
      validateReturnInput({ ...valid, reason: "  " })?.reason,
    ).toBeTruthy();
    expect(validateReturnInput({ ...valid, reason: 42 })?.reason).toBeTruthy();
    expect(
      validateReturnInput({
        ...valid,
        reason: "x".repeat(RETURN_REASON_MAX + 1),
      })?.reason,
    ).toBeTruthy();
  });

  test("requires 1..RETURN_IMAGE_MAX images from /api/media", () => {
    expect(validateReturnInput({ ...valid, images: [] })?.images).toBeTruthy();
    expect(validateReturnInput({ ...valid, images: "x" })?.images).toBeTruthy();
    expect(
      validateReturnInput({
        ...valid,
        images: Array(RETURN_IMAGE_MAX + 1).fill("/api/media/return/a.jpg"),
      })?.images,
    ).toBeTruthy();
    expect(
      validateReturnInput({ ...valid, images: ["https://evil.example/a.jpg"] })
        ?.images,
    ).toBeTruthy();
  });
});
