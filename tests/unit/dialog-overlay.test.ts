// Guardrails for the shared dialog overlay: mobile bottom sheets must hug
// the visual viewport (h-dvh) so browser chrome never covers the sheet,
// with extra bottom clearance plus even margins once dialogs center on
// sm+. Pure module, so no mocks are needed anywhere in this file.
import { describe, expect, test } from "bun:test";
import {
  DIALOG_OVERLAY_CLASSES,
  DIALOG_OVERLAY_NESTED_CLASSES,
} from "@/components/ui/dialog-overlay";

describe("DIALOG_OVERLAY_CLASSES", () => {
  test("covers the dynamic viewport edge to edge", () => {
    for (const token of ["fixed", "inset-0", "h-dvh", "flex"]) {
      expect(DIALOG_OVERLAY_CLASSES).toContain(token);
    }
  });

  test("is a bottom sheet on mobile and centered on sm+", () => {
    expect(DIALOG_OVERLAY_CLASSES).toContain("items-end");
    expect(DIALOG_OVERLAY_CLASSES).toContain("justify-center");
    expect(DIALOG_OVERLAY_CLASSES).toContain("sm:items-center");
  });

  test("keeps clearance under the sheet on every viewport", () => {
    expect(DIALOG_OVERLAY_CLASSES).toContain("p-4");
    expect(DIALOG_OVERLAY_CLASSES).toContain("pb-6");
    expect(DIALOG_OVERLAY_CLASSES).toContain("sm:p-6");
  });

  test("sits above page content", () => {
    expect(DIALOG_OVERLAY_CLASSES).toContain("z-50");
  });
});

describe("DIALOG_OVERLAY_NESTED_CLASSES", () => {
  test("shares the sheet layout but stacks above open dialogs", () => {
    expect(DIALOG_OVERLAY_NESTED_CLASSES).toContain("z-[60]");
    for (const token of DIALOG_OVERLAY_CLASSES.split(" ")) {
      if (token === "z-50") continue;
      expect(DIALOG_OVERLAY_NESTED_CLASSES).toContain(token);
    }
  });
});
