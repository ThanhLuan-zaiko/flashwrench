import { describe, expect, test } from "bun:test";
import { toggleOpenService } from "@/components/home/services/service-accordion";

describe("toggleOpenService", () => {
  test("opens a row when nothing is open", () => {
    expect(toggleOpenService(null, "svc-1")).toBe("svc-1");
  });

  test("closes the row that is already open", () => {
    expect(toggleOpenService("svc-1", "svc-1")).toBeNull();
  });

  test("switches to another row, so only one stays open", () => {
    expect(toggleOpenService("svc-1", "svc-2")).toBe("svc-2");
  });
});
