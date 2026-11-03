import { describe, expect, test } from "bun:test";
import { tabWrapTarget } from "@/lib/a11y/tab-wrap";

describe("tabWrapTarget", () => {
  test("wraps Tab from the last item back to the first", () => {
    expect(tabWrapTarget(3, 2, false)).toBe(0);
  });

  test("lets Tab move normally between inner items", () => {
    expect(tabWrapTarget(3, 0, false)).toBeNull();
    expect(tabWrapTarget(3, 1, false)).toBeNull();
  });

  test("wraps Shift+Tab from the first item to the last", () => {
    expect(tabWrapTarget(3, 0, true)).toBe(2);
  });

  test("lets Shift+Tab move normally between inner items", () => {
    expect(tabWrapTarget(3, 1, true)).toBeNull();
    expect(tabWrapTarget(3, 2, true)).toBeNull();
  });

  test("pulls focus from the container or outside back inside", () => {
    expect(tabWrapTarget(3, -1, false)).toBe(0);
    expect(tabWrapTarget(3, -1, true)).toBe(2);
  });

  test("does nothing when the dialog has no focusable items", () => {
    expect(tabWrapTarget(0, -1, false)).toBeNull();
    expect(tabWrapTarget(0, -1, true)).toBeNull();
  });
});
