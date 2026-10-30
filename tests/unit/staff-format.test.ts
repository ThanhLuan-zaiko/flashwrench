// The staff top bar avatar shows first + last initials of the full name.
import { describe, expect, test } from "bun:test";
import { getStaffInitials } from "@/components/staff/staff-format";

describe("getStaffInitials", () => {
  test("uses first and last word for multi-word names", () => {
    expect(getStaffInitials("Nguyễn Văn An")).toBe("NA");
    expect(getStaffInitials("  trần   bình  ")).toBe("TB");
  });

  test("uses one letter for single-word names", () => {
    expect(getStaffInitials("linh")).toBe("L");
  });

  test("falls back to a question mark for empty names", () => {
    expect(getStaffInitials("")).toBe("?");
    expect(getStaffInitials("   ")).toBe("?");
  });
});
