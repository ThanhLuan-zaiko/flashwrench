import { describe, expect, test } from "bun:test";
import { focusFirstInvalid } from "@/components/booking/focus-first-invalid";

// focusFirstInvalid scrolls the first flagged control or alert into view
// after a rejected submit, focusing real invalid fields. Stubs stand in
// for the DOM so the test stays DOM-free.

type StubTarget = {
  getAttribute(name: string): string | null;
  focus(options?: FocusOptions): void;
  scrollIntoView(options?: ScrollIntoViewOptions): void;
  calls: { scroll?: ScrollIntoViewOptions; focus?: FocusOptions };
};

function makeTarget(attrs: Record<string, string>): StubTarget {
  const target: StubTarget = {
    calls: {},
    getAttribute: (name) => attrs[name] ?? null,
    focus(options) {
      target.calls.focus = options;
    },
    scrollIntoView(options) {
      target.calls.scroll = options;
    },
  };
  return target;
}

describe("focusFirstInvalid", () => {
  test("returns false when nothing is flagged", () => {
    let queried = "";
    const found = focusFirstInvalid({
      querySelector: (selector) => {
        queried = selector;
        return null;
      },
    });
    expect(found).toBe(false);
    expect(queried).toContain('[aria-invalid="true"]');
    expect(queried).toContain('[role="alert"]');
  });

  test("scrolls and focuses the first invalid field", () => {
    const field = makeTarget({ "aria-invalid": "true" });
    const found = focusFirstInvalid({ querySelector: () => field });
    expect(found).toBe(true);
    expect(field.calls.scroll).toEqual({ block: "center" });
    expect(field.calls.focus).toEqual({ preventScroll: true });
  });

  test("scrolls to an alert without focusing it", () => {
    const alert = makeTarget({ role: "alert" });
    const found = focusFirstInvalid({ querySelector: () => alert });
    expect(found).toBe(true);
    expect(alert.calls.scroll).toEqual({ block: "center" });
    expect(alert.calls.focus).toBeUndefined();
  });
});
