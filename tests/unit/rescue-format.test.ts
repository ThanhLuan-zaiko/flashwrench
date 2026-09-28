import { describe, expect, test } from "bun:test";
import {
  RESCUE_STATUS_LABELS,
  rescueStatusBadgeClass,
  rescueStatusLabel,
} from "@/components/rescue/rescue-format";
import { RESCUE_STATUSES } from "@/lib/rescue/rescue-status";

describe("rescueStatusLabel", () => {
  test("labels every known status in Vietnamese", () => {
    for (const status of RESCUE_STATUSES) {
      expect(RESCUE_STATUS_LABELS[status]).toBeTruthy();
      expect(rescueStatusLabel(status)).toBe(RESCUE_STATUS_LABELS[status]);
    }
  });

  test("null and unknown statuses degrade safely", () => {
    expect(rescueStatusLabel(null)).toBe("Chờ điều phối");
    expect(rescueStatusLabel("flying")).toBe("flying");
  });
});

describe("rescueStatusBadgeClass", () => {
  test("terminal and in-flight statuses get distinct treatments", () => {
    expect(rescueStatusBadgeClass("cancelled")).toContain("text-zinc-500");
    expect(rescueStatusBadgeClass("completed")).toContain("bg-zinc-900");
    expect(rescueStatusBadgeClass("dispatched")).toContain("border-zinc-400");
    expect(rescueStatusBadgeClass(null)).toContain("border-zinc-400");
  });
});
