import { describe, expect, test } from "bun:test";
import {
  COMPLAINT_STATUS_LABELS,
  formatViDate,
} from "@/app/admin/components/users/complaint-format";

describe("complaint-format", () => {
  test("labels every status in Vietnamese", () => {
    expect(COMPLAINT_STATUS_LABELS.open).toBe("Mới");
    expect(COMPLAINT_STATUS_LABELS.in_review).toBe("Đang xử lý");
    expect(COMPLAINT_STATUS_LABELS.resolved).toBe("Đã giải quyết");
    expect(COMPLAINT_STATUS_LABELS.rejected).toBe("Từ chối");
  });

  test("formats ISO dates for vi-VN and guards bad input", () => {
    expect(formatViDate("2026-09-12T00:00:00.000Z")).toBe("12/09/2026");
    expect(formatViDate(null)).toBe("Chưa rõ");
    expect(formatViDate("not-a-date")).toBe("Chưa rõ");
  });
});
